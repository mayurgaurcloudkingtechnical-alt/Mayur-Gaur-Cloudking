import { db } from "@/server/db/client";
import { StaffDepartment, UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { EmailService } from "./email.service";
import { AttendanceIntegrationService } from "./attendance-integration.service";

export interface OnboardEmployeeInput {
  // Step 1: Employee Profile
  employeeId?: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  officialEmail?: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  residentialAddress?: string;
  gender?: string;
  dateOfBirth?: Date;
  joiningDate?: Date;
  employmentType?: string; // FULL_TIME, PART_TIME, CONTRACT, INTERN
  probationMonths?: number;
  department: StaffDepartment;
  designation: string;
  reportingManagerId?: string;
  branch?: string;
  workLocation?: string;
  shiftId?: string;
  baseSalary: number; // in integer Paise

  // Step 2: Employment Documentation
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  documents?: {
    documentType: string; // RESUME, OFFER_LETTER, APPOINTMENT_LETTER, AADHAAR, PAN, CERTIFICATE, POLICY_ACK
    title: string;
    documentUrl: string;
  }[];

  // Step 3: System Account & Access
  roleCode: UserRoleCode;
  password?: string;
  sendInviteEmail?: boolean;
  callingNumber?: string;
  whatsappNumber?: string;

  // Step 4: Checklist Tasks
  initialChecklist?: {
    docVerificationDone?: boolean;
    offerLetterAckDone?: boolean;
    roleAssignmentDone?: boolean;
    crmAccessVerified?: boolean;
    hrmsProfileDone?: boolean;
    attendancePolicyAckDone?: boolean;
    trainingInductionDone?: boolean;
    managerApprovalDone?: boolean;
  };

  // Step 5: Save as Draft or Immediate Activation
  status?: "DRAFT" | "ACTIVE" | "PENDING";
}

export class StaffOnboardingService {
  /**
   * Generates a guaranteed unique, sequential Employee ID (e.g. SLG-EMP-2026-0001)
   */
  static async generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.staffProfile.count();
    let seq = count + 1;
    let employeeId = `SLG-EMP-${year}-${String(seq).padStart(4, "0")}`;

    while (await db.staffProfile.findUnique({ where: { employeeId } })) {
      seq += 1;
      employeeId = `SLG-EMP-${year}-${String(seq).padStart(4, "0")}`;
    }
    return employeeId;
  }

  /**
   * Validates whether candidate email or phone is already taken
   */
  static async checkUniqueness(email: string, phone?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || null;

    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
      include: { staffProfile: true },
    });

    return {
      isTaken: Boolean(existingUser),
      hasStaffProfile: Boolean(existingUser?.staffProfile),
      existingUserId: existingUser?.id || null,
      existingUserRole: existingUser?.roleCode || null,
    };
  }

  /**
   * Full 5-Step Staff Onboarding Execution
   */
  static async onboardEmployee(actor: AuthenticatedUser, input: OnboardEmployeeInput) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to onboard institutional staff.",
      });
    }

    const primaryEmail = (input.officialEmail || input.personalEmail).trim().toLowerCase();
    const cleanPhone = input.phone?.trim() || null;

    // Check if user already exists
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: primaryEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
      include: { staffProfile: true },
    });

    if (user && user.staffProfile) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `An active employee profile already exists for ${primaryEmail}.`,
      });
    }

    // Generate Employee ID
    const employeeId = input.employeeId?.trim() || (await this.generateEmployeeId());
    const existingEmp = await db.staffProfile.findUnique({ where: { employeeId } });
    if (existingEmp) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Employee ID ${employeeId} is already in use.`,
      });
    }

    // Generate secure temporary password
    const tempPassword = input.password?.trim() || `SoftLab@${new Date().getFullYear()}!${randomBytes(3).toString("hex")}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Atomic creation
    const result = await db.$transaction(
      async (tx) => {
        // 1. Create or link User
        if (!user) {
          user = await tx.user.create({
            data: {
              email: primaryEmail,
              phone: cleanPhone,
              callingNumber: input.callingNumber?.trim() || cleanPhone,
              whatsappNumber: input.whatsappNumber?.trim() || cleanPhone,
              passwordHash,
              firstName: input.firstName.trim(),
              lastName: input.lastName.trim(),
              roleCode: input.roleCode,
              status: input.status === "ACTIVE" ? "ACTIVE" : "ACTIVE",
            },
            include: { staffProfile: true },
          });
        } else {
          // Update existing user role and contact numbers if linking
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              roleCode: input.roleCode,
              callingNumber: input.callingNumber?.trim() || user.callingNumber,
              whatsappNumber: input.whatsappNumber?.trim() || user.whatsappNumber,
            },
            include: { staffProfile: true },
          });
        }

        // 2. Create StaffProfile
        const staffProfile = await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId,
            department: input.department,
            designation: input.designation.trim(),
            baseSalary: input.baseSalary,
            joiningDate: input.joiningDate || new Date(),
            personalEmail: input.personalEmail.trim().toLowerCase(),
            personalPhone: cleanPhone,
            emergencyContactName: input.emergencyContactName?.trim(),
            emergencyContactPhone: input.emergencyContactPhone?.trim(),
            residentialAddress: input.residentialAddress?.trim(),
            gender: input.gender,
            dateOfBirth: input.dateOfBirth,
            employmentType: input.employmentType || "FULL_TIME",
            probationMonths: input.probationMonths ?? 3,
            reportingManagerId: input.reportingManagerId,
            branch: input.branch || "PRAYAGRAJ_MAIN",
            workLocation: input.workLocation || "PRAYAGRAJ_CAMPUS",
            shiftId: input.shiftId,
            bankAccountNumber: input.bankAccountNumber?.trim(),
            bankIfsc: input.bankIfsc?.trim().toUpperCase(),
            panNumber: input.panNumber?.trim().toUpperCase(),
            employmentStatus: input.status === "DRAFT" ? "PROBATION" : "ACTIVE",
            isActive: input.status !== "DRAFT",
          },
        });

        // 3. Create Documents if provided
        if (input.documents && input.documents.length > 0) {
          for (const doc of input.documents) {
            await tx.staffDocument.create({
              data: {
                staffId: staffProfile.id,
                title: doc.title.trim(),
                documentType: doc.documentType.trim(),
                documentUrl: doc.documentUrl.trim(),
                isVerified: false,
              },
            });
          }
        }

        // 4. Initialize Onboarding Checklist
        const checklist = input.initialChecklist || {};
        const completedCount = Object.values(checklist).filter(Boolean).length;
        const completionPercent = Math.round((completedCount / 8) * 100);

        await tx.staffOnboardingChecklist.create({
          data: {
            staffId: staffProfile.id,
            personalDetailsDone: true,
            documentsUploaded: (input.documents && input.documents.length > 0) || false,
            bankDetailsVerified: Boolean(input.bankAccountNumber && input.bankIfsc),
            workstationAssigned: true,
            emailAccountCreated: true,
            slackOrPortalInvited: true,
            orientationCompleted: checklist.trainingInductionDone || false,
            docVerificationDone: checklist.docVerificationDone || false,
            offerLetterAckDone: checklist.offerLetterAckDone || false,
            roleAssignmentDone: checklist.roleAssignmentDone ?? true,
            crmAccessVerified: checklist.crmAccessVerified ?? true,
            hrmsProfileDone: checklist.hrmsProfileDone ?? true,
            attendancePolicyAckDone: checklist.attendancePolicyAckDone || false,
            trainingInductionDone: checklist.trainingInductionDone || false,
            managerApprovalDone: checklist.managerApprovalDone ?? true,
            completionPercent,
            status: completionPercent === 100 ? "COMPLETED" : "IN_PROGRESS",
          },
        });

        // 5. If Trainer role, initialize TrainerProfile
        if (input.roleCode === UserRoleCode.TRAINER) {
          await tx.trainerProfile.create({
            data: {
              userId: user.id,
              specializations: [input.designation.trim()],
              experienceYears: 1,
            },
          });
        }

        // 6. Security Audit Log
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: "STAFF_ONBOARDED",
            resourceType: "StaffProfile",
            resourceId: staffProfile.id,
            newData: {
              employeeId,
              email: primaryEmail,
              department: input.department,
              designation: input.designation,
              roleCode: input.roleCode,
            },
          },
        });

        return { user, staffProfile };
      },
      { maxWait: 15000, timeout: 30000 }
    );

    // Initialize Default Leave Balances
    await AttendanceIntegrationService.getOrCreateLeaveBalances(result.staffProfile.id);

    // Send Credentials Email if enabled
    if (input.sendInviteEmail !== false) {
      EmailService.sendStaffCredentials({
        to: primaryEmail,
        staffName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        employeeId,
        loginEmail: primaryEmail,
        temporaryPassword: tempPassword,
        roleName: input.roleCode,
        designation: input.designation.trim(),
      }).catch((err) => console.error("[StaffOnboardingService] Email notification error:", err));
    }

    return {
      success: true,
      employeeId,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: `${result.user.firstName} ${result.user.lastName}`,
        roleCode: result.user.roleCode,
      },
      staffProfile: result.staffProfile,
      message: `Employee ${result.user.firstName} ${result.user.lastName} successfully onboarded with ID ${employeeId}.`,
    };
  }

  /**
   * Update checklist step
   */
  static async updateChecklistStep(staffId: string, updates: Record<string, boolean>) {
    const checklist = await db.staffOnboardingChecklist.findUnique({
      where: { staffId },
    });
    if (!checklist) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Onboarding checklist not found." });
    }

    const merged = { ...checklist, ...updates };
    const stepKeys = [
      "docVerificationDone",
      "offerLetterAckDone",
      "roleAssignmentDone",
      "crmAccessVerified",
      "hrmsProfileDone",
      "attendancePolicyAckDone",
      "trainingInductionDone",
      "managerApprovalDone",
    ] as const;

    const completedCount = stepKeys.filter((k) => (merged as any)[k]).length;
    const completionPercent = Math.round((completedCount / stepKeys.length) * 100);

    return db.staffOnboardingChecklist.update({
      where: { staffId },
      data: {
        ...updates,
        completionPercent,
        status: completionPercent === 100 ? "COMPLETED" : "IN_PROGRESS",
        ...(completionPercent === 100 ? { completedAt: new Date() } : {}),
      },
    });
  }
}
