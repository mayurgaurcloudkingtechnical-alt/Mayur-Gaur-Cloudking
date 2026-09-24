import { db } from "@/server/db/client";
import { AuthenticatedUser, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { TRPCError } from "@trpc/server";
import {
  ApplicationStage,
  LeadStatus,
  LeadSource,
  UserRoleCode,
  PaymentMethod,
  EnrollmentStatus,
  FeePaymentStatus,
  InstallmentStatus,
  DeliveryMode,
  Prisma,
} from "@prisma/client";
import { CrmConversionService } from "./crm-conversion.service";
import { normalizeEmail, normalizePhone } from "./crm-lead.service";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { EmailService } from "./email.service";
import { ReceiptService } from "./receipt.service";

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
  dateOfBirth?: Date | string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  highestQualification?: string;
  fatherName?: string;
  motherName?: string;
  whatsappNumber?: string;
  alternatePhone?: string;
  schoolOrCollege?: string;
  passingYear?: string;
  percentageOrCgpa?: string;
  photoUrl?: string;
  paymentMethod?: PaymentMethod;
  leadId?: string;
  source?: LeadSource;
  totalCourseFee?: number;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  discountAmount?: number;
  discountReason?: string;
  finalFee?: number;
  paidAmount?: number;
  paymentPlan?: "LUMPSUM" | "EMI";
  installmentCount?: number;
  installments?: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date | string;
    notes?: string;
  }>;
  paymentType?: "OFFLINE" | "ONLINE";
  paymentReference?: string;
  remarks?: string;
  providerType?: string;
  providerName?: string;
  universityName?: string;
  universityProgram?: string;
  universitySpecialization?: string;
  admissionSession?: string;
  universityRegistrationFee?: number;
  universityExaminationFee?: number;
  universityFee?: number;
  deliveryMode?: DeliveryMode;
  center?: string;
}

export interface UpdateApplicationInput {
  applicationId: string;
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: Date | string;
  gender?: string;
  whatsappNumber?: string;
  alternatePhone?: string;
  schoolOrCollege?: string;
  passingYear?: string;
  percentageOrCgpa?: string;
  photoUrl?: string;
  center?: string;
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
  private static async generateAppNumber(tx: any = db): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const code = `APP-${year}-${rand}`;
      const existing = await tx.admissionApplication.findUnique({
        where: { applicationNumber: code },
        select: { id: true },
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
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
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
   * Atomically provisions: User Account, StudentProfile, AdmissionApplication, Enrollment, FeeStructure,
   * PaymentTransaction, StudentIdCard, and dispatches credentials/receipt emails.
   */
  static async createDirectAdmission(user: AuthenticatedUser, input: CreateDirectAdmissionInput) {
    const canCreate = hasPermission(user.permissions, "admissions:create");
    if (!canCreate) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to create admission applications.",
      });
    }

    const cleanPhone = normalizePhone(input.applicantPhone);
    const cleanEmail = normalizeEmail(input.applicantEmail);

    const course = await db.course.findUnique({ where: { id: input.courseId } });
    if (!course) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Course with ID '${input.courseId}' not found.`,
      });
    }

    const isUniversity = course.providerType === "UNIVERSITY" || input.providerType === "UNIVERSITY";
    const univName = isUniversity ? (course.universityName || input.universityName || "Dr. Preeti Global University") : null;
    const univProg = isUniversity ? (input.universityProgram || course.title) : null;
    const univSpec = isUniversity ? (input.universitySpecialization || course.specialization || null) : null;
    const admSession = isUniversity ? (input.admissionSession || course.admissionSession || "2025-2026") : null;
    const univRegFee = isUniversity ? (input.universityRegistrationFee ?? course.registrationFee ?? 100000) : null;
    const univExamFee = isUniversity ? (input.universityExaminationFee ?? course.examinationFee ?? 100000) : null;
    const univFee = isUniversity ? (input.universityFee ?? course.universityFeeYear ?? course.baseFee ?? null) : null;

    // Lead handling
    let leadId = input.leadId;
    if (!leadId) {
      let lead = await db.lead.findFirst({
        where: { OR: [{ phone: cleanPhone }, { email: cleanEmail }] },
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
            status: LeadStatus.ADMITTED,
            qualityScore: "HOT",
            interestedCourseId: input.courseId,
            providerType: isUniversity ? "UNIVERSITY" : "SOFTLAB",
            providerName: isUniversity ? (course.providerName || "Dr. Preeti Global University") : "SoftLab Global",
            universityName: univName,
            universityProgram: univProg,
            universitySpecialization: univSpec,
            notes: isUniversity
              ? `Direct university admission initiated for ${univProg} (${univSpec || "General"}).`
              : "Direct admission application initiated from Admissions Desk.",
            assignedToId: user.id,
            assignedCounselorId: user.id,
            createdById: user.id,
          },
        });
      } else {
        await db.lead.update({
          where: { id: lead.id },
          data: {
            status: LeadStatus.ADMITTED,
            ...(isUniversity
              ? {
                  providerType: "UNIVERSITY",
                  providerName: course.providerName || "Dr. Preeti Global University",
                  universityName: univName,
                  universityProgram: univProg,
                  universitySpecialization: univSpec,
                }
              : {}),
          },
        });
      }
      leadId = lead.id;
    } else {
      await db.lead.update({
        where: { id: leadId },
        data: {
          status: LeadStatus.ADMITTED,
          ...(isUniversity
            ? {
                providerType: "UNIVERSITY",
                providerName: course.providerName || "Dr. Preeti Global University",
                universityName: univName,
                universityProgram: univProg,
                universitySpecialization: univSpec,
              }
            : {}),
        },
      });
    }

    // Execute atomic transaction for Phase 7 & 8 & 9 & 10 & 11
    const year = new Date().getFullYear();
    const tempPassword = `SoftLab@${year}!${randomBytes(3).toString("hex")}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const nameParts = input.applicantName.trim().split(" ");
    const firstName = nameParts[0] || "Student";
    const lastName = nameParts.slice(1).join(" ") || "Learner";

    return await db.$transaction(async (tx) => {
      // 1. User Account
      let targetUser = await tx.user.findUnique({ where: { email: cleanEmail } });
      if (!targetUser) {
        targetUser = await tx.user.create({
          data: {
            email: cleanEmail,
            phone: cleanPhone,
            passwordHash,
            firstName,
            lastName,
            avatarUrl: input.photoUrl || null,
            roleCode: UserRoleCode.STUDENT,
          },
        });
      } else {
        if (input.photoUrl) {
          await tx.user.update({
            where: { id: targetUser.id },
            data: { avatarUrl: input.photoUrl },
          });
        }
      }

      // 2. StudentProfile
      let studentProfile = await tx.studentProfile.findUnique({
        where: { userId: targetUser.id },
      });

      if (!studentProfile) {
        const studentCount = await tx.studentProfile.count();
        let studentCode = "";
        for (let i = 1; i <= 25; i++) {
          const candidate = `SG-${year}-${(studentCount + i).toString().padStart(5, "0")}`;
          const existing = await tx.studentProfile.findUnique({
            where: { studentId: candidate },
            select: { id: true },
          });
          if (!existing) {
            studentCode = candidate;
            break;
          }
        }
        if (!studentCode) {
          studentCode = `SG-${year}-${Date.now().toString().slice(-5)}`;
        }

        studentProfile = await tx.studentProfile.create({
          data: {
            userId: targetUser.id,
            studentId: studentCode,
            dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
            gender: input.gender?.trim() || null,
            address: input.address?.trim() || null,
            city: input.city?.trim() || null,
            state: input.state?.trim() || null,
            pincode: input.pincode?.trim() || null,
            highestDegree: input.highestQualification?.trim() || null,
            fatherName: input.fatherName?.trim() || null,
            motherName: input.motherName?.trim() || null,
            whatsappNumber: input.whatsappNumber?.trim() || null,
            alternatePhone: input.alternatePhone?.trim() || null,
            schoolOrCollege: input.schoolOrCollege?.trim() || null,
            passingYear: input.passingYear?.trim() || null,
            percentageOrCgpa: input.percentageOrCgpa?.trim() || null,
            center: "SOFTLAB GLOBAL Main Campus, Prayagraj",
            educationProvider: isUniversity ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL",
            universityName: univName,
            universityProgram: univProg,
            universitySpecialization: univSpec,
            universityAdmissionSession: admSession,
            universityPortalStatus: isUniversity ? "PROVISIONED" : null,
            photoUrl: input.photoUrl?.trim() || null,
          },
        });
      } else {
        studentProfile = await tx.studentProfile.update({
          where: { id: studentProfile.id },
          data: {
            ...(input.photoUrl ? { photoUrl: input.photoUrl.trim() } : {}),
            ...(isUniversity
              ? {
                  educationProvider: "Dr. Preeti Global University",
                  universityName: univName,
                  universityProgram: univProg,
                  universitySpecialization: univSpec,
                  universityAdmissionSession: admSession,
                  universityPortalStatus: "PROVISIONED",
                }
              : {}),
          },
        });
      }

      const applicationNumber = await this.generateAppNumber(tx);
      const computedTotalFee = (input.totalCourseFee && input.totalCourseFee > 0)
        ? Math.floor(input.totalCourseFee)
        : (course.baseFee || 3500000);
      const computedDiscount = input.discountAmount ? Math.floor(input.discountAmount) : 0;
      const computedNet = Math.max(0, computedTotalFee - computedDiscount);

      const decisionReason = JSON.stringify({
        totalCourseFee: computedTotalFee,
        discountType: input.discountType || "FIXED",
        discountValue: input.discountValue || 0,
        discountAmount: computedDiscount,
        discountReason: input.discountReason || "",
        finalFee: computedNet,
        paidAmount: input.paidAmount || 0,
        paymentPlan: input.paymentPlan || "LUMPSUM",
        paymentType: input.paymentType || "OFFLINE",
        paymentReference: input.paymentReference || "",
        installmentCount: input.installmentCount || 1,
        remarks: input.remarks || "",
        isUniversity,
        universityName: univName,
        universityProgram: univProg,
        universitySpecialization: univSpec,
      });

      const application = await tx.admissionApplication.create({
        data: {
          applicationNumber,
          leadId,
          courseId: input.courseId,
          batchId: input.batchId || null,
          counselorId: user.id,
          stage: ApplicationStage.CONVERTED,
          applicantName: input.applicantName.trim(),
          applicantEmail: cleanEmail,
          applicantPhone: cleanPhone,
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
          gender: input.gender?.trim() || null,
          address: input.address?.trim() || null,
          city: input.city?.trim() || null,
          state: input.state?.trim() || null,
          pincode: input.pincode?.trim() || null,
          highestQualification: input.highestQualification?.trim() || null,
          fatherName: input.fatherName?.trim() || null,
          motherName: input.motherName?.trim() || null,
          whatsappNumber: input.whatsappNumber?.trim() || null,
          alternatePhone: input.alternatePhone?.trim() || null,
          schoolOrCollege: input.schoolOrCollege?.trim() || null,
          passingYear: input.passingYear?.trim() || null,
          percentageOrCgpa: input.percentageOrCgpa?.trim() || null,
          photoUrl: input.photoUrl || null,
          deliveryMode: input.deliveryMode || DeliveryMode.OFFLINE,
          center: input.center?.trim() || "SOFTLAB GLOBAL Main Campus, Prayagraj",
          decisionReason,
          convertedStudentProfileId: studentProfile.id,
          providerType: isUniversity ? "UNIVERSITY" : "SOFTLAB",
          providerName: isUniversity ? (course.providerName || "Dr. Preeti Global University") : "SoftLab Global",
          universityName: univName,
          universityProgram: univProg,
          universitySpecialization: univSpec,
          admissionSession: admSession,
          universityRegistrationFee: univRegFee,
          universityExaminationFee: univExamFee,
          universityFee: univFee,
          universityPortalStatus: isUniversity ? "PROVISIONED" : null,
        },
      });

      // 4. Enrollment
      let enrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: studentProfile.id,
            courseId: input.courseId,
          },
        },
      });

      if (!enrollment) {
        enrollment = await tx.enrollment.create({
          data: {
            studentId: studentProfile.id,
            courseId: input.courseId,
            batchId: input.batchId || null,
            status: EnrollmentStatus.ACTIVE,
          },
        });
      }

      // 5. FeeStructure & Financial Terms
      const totalCourseFee = (input.totalCourseFee && input.totalCourseFee > 0)
        ? Math.floor(input.totalCourseFee)
        : (course.baseFee || 3500000);
      const discountPaise = input.discountAmount ? Math.floor(input.discountAmount) : 0;

      // Check discount authorization (Standard limit: 15%)
      const isPrivilegedRole =
        user.roleCode === UserRoleCode.SUPER_ADMIN ||
        user.roleCode === UserRoleCode.DIRECTOR ||
        user.roleCode === UserRoleCode.ADMIN ||
        hasPermission(user.permissions, "admissions:approve_discount");

      const discountPercent = totalCourseFee > 0 ? (discountPaise / totalCourseFee) * 100 : 0;
      if (discountPercent > 15 && !isPrivilegedRole && !input.discountReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Discounts exceeding 15% require Director / Super Admin authorization and a stated justification reason.",
        });
      }

      const netPayable = Math.max(0, totalCourseFee - discountPaise);
      const paidPaise = input.paidAmount ? Math.floor(input.paidAmount) : 0;
      const pendingPaise = Math.max(0, netPayable - paidPaise);
      const paymentStatus = pendingPaise === 0
        ? FeePaymentStatus.PAID
        : paidPaise > 0
          ? FeePaymentStatus.PARTIAL
          : FeePaymentStatus.PENDING;

      let feeStructure = await tx.feeStructure.findUnique({
        where: { enrollmentId: enrollment.id },
      });

      if (!feeStructure) {
        feeStructure = await tx.feeStructure.create({
          data: {
            studentId: studentProfile.id,
            enrollmentId: enrollment.id,
            courseId: input.courseId,
            batchId: input.batchId || null,
            totalCourseFee,
            discountAmount: discountPaise,
            netPayableAmount: netPayable,
            paidAmount: paidPaise,
            pendingAmount: pendingPaise,
            paymentStatus,
            status: "ACTIVE",
            createdById: user.id,
            remarks: input.remarks || input.discountReason || null,
            examinationFee: univExamFee ?? 0,
            universityFee: univFee ?? 0,
          },
        });
      } else {
        const newPaid = feeStructure.paidAmount + paidPaise;
        const newPending = Math.max(0, feeStructure.netPayableAmount - newPaid);
        feeStructure = await tx.feeStructure.update({
          where: { id: feeStructure.id },
          data: {
            totalCourseFee,
            discountAmount: discountPaise,
            netPayableAmount: netPayable,
            paidAmount: newPaid,
            pendingAmount: newPending,
            paymentStatus: newPending === 0 ? FeePaymentStatus.PAID : FeePaymentStatus.PARTIAL,
            remarks: input.remarks || input.discountReason || feeStructure.remarks,
            ...(isUniversity
              ? {
                  examinationFee: univExamFee ?? 0,
                  universityFee: univFee ?? 0,
                }
              : {}),
          },
        });
      }

      // 5b. Fee Installments (EMI Slot Management)
      const createdInstallments: any[] = [];
      if (input.paymentPlan === "EMI" && input.installments && input.installments.length > 0) {
        let remainingPaidAllocation = paidPaise;

        // Clean up any existing installments for this feeStructure if recreating
        await tx.feeInstallment.deleteMany({
          where: { feeStructureId: feeStructure.id },
        });

        for (let i = 0; i < input.installments.length; i++) {
          const inst = input.installments[i];
          const instAmount = Math.floor(inst.amount);
          let instPaid = 0;
          let instStatus: InstallmentStatus = InstallmentStatus.PENDING;

          if (remainingPaidAllocation > 0) {
            if (remainingPaidAllocation >= instAmount) {
              instPaid = instAmount;
              instStatus = InstallmentStatus.PAID;
              remainingPaidAllocation -= instAmount;
            } else {
              instPaid = remainingPaidAllocation;
              instStatus = InstallmentStatus.PARTIAL;
              remainingPaidAllocation = 0;
            }
          }

          const createdInst = await tx.feeInstallment.create({
            data: {
              feeStructureId: feeStructure.id,
              installmentNumber: inst.installmentNumber || i + 1,
              amount: instAmount,
              paidAmount: instPaid,
              dueDate: new Date(inst.dueDate),
              status: instStatus,
              paidAt: instPaid > 0 ? new Date() : null,
              notes: inst.notes?.trim() || (i === 0 && instPaid > 0 ? "Down-payment / 1st EMI collected at admission" : null),
            },
          });
          createdInstallments.push(createdInst);
        }
      }

      // 6. PaymentTransaction & Instant Receipt Number
      let paymentRecord: any = null;
      let receiptNumber: string | null = null;

      if (paidPaise > 0) {
        receiptNumber = await ReceiptService.generateReceiptNumber();
        const randTxn = Math.floor(100000 + Math.random() * 900000);
        const transactionReference = input.paymentReference?.trim() || `PAY-${year}-${randTxn}`;
        const finalPaymentMethod = input.paymentMethod || (input.paymentType === "ONLINE" ? PaymentMethod.RAZORPAY : PaymentMethod.CASH);

        paymentRecord = await tx.paymentTransaction.create({
          data: {
            transactionReference,
            feeStructureId: feeStructure.id,
            studentId: studentProfile.id,
            enrollmentId: enrollment.id,
            admissionId: application.id,
            amount: paidPaise,
            paymentMethod: finalPaymentMethod,
            status: "SUCCESS",
            receiptNumber,
            receivedById: user.id,
            remarks: input.remarks || input.discountReason || (input.paymentPlan === "EMI" ? "Initial EMI / Admission fee collection" : "Initial admission fee collection"),
            paidAt: new Date(),
          },
        });
      }

      // 7. Student ID Card
      let idCard = await tx.studentIdCard.findUnique({
        where: { studentId: studentProfile.id },
      });

      if (!idCard) {
        const idCardCount = await tx.studentIdCard.count();
        const cardNumber = `SLG-IDC-${year}-${(idCardCount + 1).toString().padStart(5, "0")}`;
        const validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);

        idCard = await tx.studentIdCard.create({
          data: {
            studentId: studentProfile.id,
            cardNumber,
            validUntil,
            qrCodeData: JSON.stringify({
              studentId: studentProfile.studentId,
              name: input.applicantName.trim(),
              course: isUniversity ? (univProg || course.title) : course.title,
              provider: isUniversity ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL",
              validUntil: validUntil.toISOString().slice(0, 10),
            }),
            status: "ACTIVE",
            educationProvider: isUniversity ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL",
            universityName: univName,
            universityProgram: univProg,
          },
        });
      }

      // 8. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "DIRECT_ADMISSION_COMPLETED_WITH_STUDENT_ACCOUNT",
          resourceType: "AdmissionApplication",
          resourceId: application.id,
          newData: {
            applicationNumber: application.applicationNumber,
            studentId: studentProfile.studentId,
            userId: targetUser.id,
            feeStructureId: feeStructure.id,
            receiptNumber,
            providerType: isUniversity ? "UNIVERSITY" : "SOFTLAB",
          },
        },
      });

      // 9. Dispatch Email Notifications asynchronously
      EmailService.sendAdmissionConfirmation({
        to: cleanEmail,
        studentName: input.applicantName.trim(),
        studentId: studentProfile.studentId,
        admissionNumber: application.applicationNumber,
        courseName: isUniversity ? `${course.title} (Dr. Preeti Global University)` : course.title,
        batchName: input.batchId ? "Enrolled Batch" : undefined,
      }).catch((e) => console.error("[Admission Email Error]", e));

      EmailService.sendStudentCredentials({
        to: cleanEmail,
        studentName: input.applicantName.trim(),
        studentId: studentProfile.studentId,
        loginEmail: cleanEmail,
        temporaryPassword: tempPassword,
      }).catch((e) => console.error("[Credentials Email Error]", e));

      if (paidPaise > 0 && receiptNumber) {
        EmailService.sendFeeReceipt({
          to: cleanEmail,
          studentName: input.applicantName.trim(),
          studentId: studentProfile.studentId,
          receiptNumber,
          amountPaidPaise: paidPaise,
          pendingAmountPaise: pendingPaise,
          paymentMethod: input.paymentMethod || "CASH",
          courseName: isUniversity ? `${course.title} (Dr. Preeti Global University)` : course.title,
        }).catch((e) => console.error("[Fee Receipt Email Error]", e));
      }

      return {
        success: true,
        id: application.id,
        application,
        studentProfile,
        student: studentProfile,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          avatarUrl: targetUser.avatarUrl,
        },
        credentials: {
          studentId: studentProfile.studentId,
          admissionNumber: application.applicationNumber,
          email: cleanEmail,
          temporaryPassword: tempPassword,
          fullName: input.applicantName.trim(),
          providerType: isUniversity ? "UNIVERSITY" : "SOFTLAB",
          universityName: univName,
          universityProgram: univProg,
        },
        receiptNumber,
        payment: paymentRecord,
        idCard,
        feeStructure,
        installments: createdInstallments,
        isUniversity,
        universityName: univName,
        universityProgram: univProg,
        universitySpecialization: univSpec,
        admissionSession: admSession,
        universityRegistrationFee: univRegFee,
        universityExaminationFee: univExamFee,
        universityFee: univFee,
      };
    }, { maxWait: 15000, timeout: 30000 });
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
          course: { select: { id: true, title: true, providerType: true, providerName: true, universityName: true } },
          batch: { select: { id: true, name: true, code: true } },
          counselor: { select: { id: true, firstName: true, lastName: true } },
          reviewer: { select: { id: true, firstName: true, lastName: true } },
          payments: {
            select: {
              id: true,
              status: true,
              amount: true,
              receiptNumber: true,
              transactionReference: true,
              paidAt: true,
              paymentMethod: true,
            },
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          convertedStudentProfile: {
            select: {
              id: true,
              studentId: true,
              photoUrl: true,
              user: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
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
            photoUrl: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
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
      user.roleCode === "ADMIN" ||
      user.roleCode === "COUNSELOR" ||
      user.roleCode === "MANAGER";

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
        ...(input.fatherName !== undefined ? { fatherName: input.fatherName?.trim() || null } : {}),
        ...(input.motherName !== undefined ? { motherName: input.motherName?.trim() || null } : {}),
        ...(input.dateOfBirth ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
        ...(input.gender !== undefined ? { gender: input.gender?.trim() || null } : {}),
        ...(input.whatsappNumber !== undefined ? { whatsappNumber: input.whatsappNumber?.trim() || null } : {}),
        ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone?.trim() || null } : {}),
        ...(input.schoolOrCollege !== undefined ? { schoolOrCollege: input.schoolOrCollege?.trim() || null } : {}),
        ...(input.passingYear !== undefined ? { passingYear: input.passingYear?.trim() || null } : {}),
        ...(input.percentageOrCgpa !== undefined ? { percentageOrCgpa: input.percentageOrCgpa?.trim() || null } : {}),
        ...(input.photoUrl ? { photoUrl: input.photoUrl.trim() } : {}),
        ...(input.center !== undefined ? { center: input.center?.trim() || null } : {}),
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

    // Synchronize updates directly to StudentProfile & User when student is already admitted
    if (app.convertedStudentProfileId) {
      await db.studentProfile.update({
        where: { id: app.convertedStudentProfileId },
        data: {
          ...(input.photoUrl ? { photoUrl: input.photoUrl.trim() } : {}),
          ...(input.fatherName !== undefined ? { fatherName: input.fatherName?.trim() || null } : {}),
          ...(input.motherName !== undefined ? { motherName: input.motherName?.trim() || null } : {}),
          ...(input.dateOfBirth ? { dateOfBirth: new Date(input.dateOfBirth) } : {}),
          ...(input.gender !== undefined ? { gender: input.gender?.trim() || null } : {}),
          ...(input.whatsappNumber !== undefined ? { whatsappNumber: input.whatsappNumber?.trim() || null } : {}),
          ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone?.trim() || null } : {}),
          ...(input.schoolOrCollege !== undefined ? { schoolOrCollege: input.schoolOrCollege?.trim() || null } : {}),
          ...(input.passingYear !== undefined ? { passingYear: input.passingYear?.trim() || null } : {}),
          ...(input.percentageOrCgpa !== undefined ? { percentageOrCgpa: input.percentageOrCgpa?.trim() || null } : {}),
          ...(input.highestQualification !== undefined ? { highestDegree: input.highestQualification?.trim() || null } : {}),
          ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
          ...(input.city !== undefined ? { city: input.city?.trim() || null } : {}),
          ...(input.state !== undefined ? { state: input.state?.trim() || null } : {}),
          ...(input.pincode !== undefined ? { pincode: input.pincode?.trim() || null } : {}),
          ...(input.center !== undefined ? { center: input.center?.trim() || null } : {}),
        },
      });

      const studentProfile = await db.studentProfile.findUnique({
        where: { id: app.convertedStudentProfileId },
        select: { userId: true },
      });

      if (studentProfile?.userId) {
        const nameParts = input.applicantName ? input.applicantName.trim().split(" ") : null;
        await db.user.update({
          where: { id: studentProfile.userId },
          data: {
            ...(nameParts ? { firstName: nameParts[0], lastName: nameParts.slice(1).join(" ") || "" } : {}),
            ...(input.applicantEmail ? { email: normalizeEmail(input.applicantEmail) } : {}),
            ...(input.applicantPhone ? { phone: normalizePhone(input.applicantPhone) } : {}),
            ...(input.photoUrl ? { avatarUrl: input.photoUrl.trim() } : {}),
          },
        });
      }
    }

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
