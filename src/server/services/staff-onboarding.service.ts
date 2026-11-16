import { db } from "@/server/db/client";
import { StaffDepartment, UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { EmailService } from "./email.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { AttendanceIntegrationService } from "./attendance-integration.service";
import { VerificationEngineService } from "./verification/verification-engine.service";
import { CentralNotificationEngine } from "./central-notification-engine.service";
import { CredentialSecurityService, generateSecureTempPassword } from "./credential-security.service";

export interface OnboardEmployeeInput {
  existingUserId?: string; // Link existing platform user (from User Management)

  // Step 1: Employee Profile
  employeeId?: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  officialEmail?: string;
  phone: string;
  profilePhoto?: string;
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
    documentType: string;
    title: string;
    documentUrl: string;
    fileName?: string;
    fileSize?: number;
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
  idempotencyKey?: string;
}

export class StaffOnboardingService {
  /**
   * Generates a guaranteed unique, monotonic Employee ID (e.g. SLG-EMP-2026-0016)
   */
  static async generateEmployeeId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SLG-EMP-${year}-`;
    const existing = await db.staffProfile.findMany({
      where: { employeeId: { startsWith: prefix } },
      select: { employeeId: true },
    });
    let maxSeq = 0;
    for (const row of existing) {
      const n = parseInt(row.employeeId.slice(prefix.length), 10);
      if (!Number.isNaN(n) && n > maxSeq) maxSeq = n;
    }
    let seq = maxSeq + 1;
    let employeeId = `${prefix}${String(seq).padStart(4, "0")}`;

    while (await db.staffProfile.findUnique({ where: { employeeId } })) {
      seq += 1;
      employeeId = `${prefix}${String(seq).padStart(4, "0")}`;
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

    if (input.idempotencyKey?.trim()) {
      const prior = await db.staffOnboardingIdempotency.findUnique({
        where: { idempotencyKey: input.idempotencyKey.trim() },
      });
      if (prior) {
        const [existingUser, existingStaff] = await Promise.all([
          db.user.findUnique({ where: { id: prior.userId } }),
          db.staffProfile.findUnique({ where: { id: prior.staffId } }),
        ]);
        if (existingUser && existingStaff) {
          return {
            success: true,
            idempotentReplay: true,
            employeeId: existingStaff.employeeId,
            credentials: null,
            user: {
              id: existingUser.id,
              email: existingUser.email,
              name: `${existingUser.firstName} ${existingUser.lastName}`,
              roleCode: existingUser.roleCode,
            },
            staffProfile: existingStaff,
            message: `Idempotent replay: ${existingUser.firstName} ${existingUser.lastName} already onboarded (${existingStaff.employeeId}).`,
          };
        }
      }
    }

    // Check if user already exists or linking an existing user
    let user: any = null;
    if (input.existingUserId) {
      user = await db.user.findUnique({
        where: { id: input.existingUserId },
        include: { staffProfile: true },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected user account for staff onboarding was not found.",
        });
      }
      if (user.staffProfile) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `This user is already an active staff member (Employee ID: ${user.staffProfile.employeeId}).`,
        });
      }
    } else {
      user = await db.user.findFirst({
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
          message: `An active employee profile already exists for ${primaryEmail} (Employee ID: ${user.staffProfile.employeeId}).`,
        });
      }
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
              avatarUrl: input.profilePhoto?.trim() || null,
              roleCode: input.roleCode,
              status: "ACTIVE",
            },
            include: { staffProfile: true },
          });
        } else {
          // If phone is updated and differs from user's current phone, verify no conflict with another user
          if (cleanPhone && cleanPhone !== user.phone) {
            const phoneConflict = await tx.user.findFirst({
              where: {
                id: { not: user.id },
                phone: cleanPhone,
              },
            });
            if (phoneConflict) {
              throw new TRPCError({
                code: "CONFLICT",
                message: `Phone number '${cleanPhone}' is already registered to another user (${phoneConflict.email}).`,
              });
            }
          }

          // Update existing user role and contact numbers if linking
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              roleCode: input.roleCode,
              ...(input.profilePhoto ? { avatarUrl: input.profilePhoto.trim() } : {}),
              ...(cleanPhone ? { phone: cleanPhone } : {}),
              callingNumber: input.callingNumber?.trim() || user.callingNumber || cleanPhone,
              whatsappNumber: input.whatsappNumber?.trim() || user.whatsappNumber || cleanPhone,
              ...(input.password ? { passwordHash } : {}),
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
            profilePhoto: input.profilePhoto?.trim() || null,
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
                fileName: doc.fileName || null,
                fileSize: doc.fileSize || null,
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

        // 5. If Trainer role, safely upsert TrainerProfile
        if (input.roleCode === UserRoleCode.TRAINER) {
          await tx.trainerProfile.upsert({
            where: { userId: user.id },
            update: {
              specializations: [input.designation.trim()],
            },
            create: {
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

    // Initialize Default Leave Balances & Store Encrypted Temporary Credential
    await AttendanceIntegrationService.getOrCreateLeaveBalances(result.staffProfile.id);
    await CredentialSecurityService.storeEncryptedTempCredential({
      targetUserId: result.user.id,
      tempPassword,
      issuedById: actor.id,
      issuedReason: "ONBOARDING",
      ttlHours: 72,
    });

    const idemKey = input.idempotencyKey?.trim() || `onboard:${primaryEmail}:${employeeId}`;
    await db.staffOnboardingIdempotency.upsert({
      where: { idempotencyKey: idemKey },
      update: {
        email: primaryEmail,
        employeeId,
        userId: result.user.id,
        staffId: result.staffProfile.id,
      },
      create: {
        idempotencyKey: idemKey,
        email: primaryEmail,
        employeeId,
        userId: result.user.id,
        staffId: result.staffProfile.id,
        emailStatus: "PENDING",
      },
    });

    // Statutory KYC & Identity Verification
    if (input.panNumber && input.panNumber.trim()) {
      try {
        await VerificationEngineService.verifyPan({
          entityType: "StaffProfile",
          entityId: result.staffProfile.id,
          panNumber: input.panNumber.trim().toUpperCase(),
          declaredName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        }, actor);
      } catch (err) {
        console.warn(`[StaffOnboarding] Statutory PAN verification init warning:`, err);
      }
    }

    if (input.bankAccountNumber && input.bankIfsc) {
      try {
        await VerificationEngineService.verifyBankAccount({
          entityType: "StaffProfile",
          entityId: result.staffProfile.id,
          accountNumber: input.bankAccountNumber.trim(),
          ifsc: input.bankIfsc.trim().toUpperCase(),
          declaredName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        }, actor);
      } catch (err) {
        console.warn(`[StaffOnboarding] Statutory Bank verification init warning:`, err);
      }
    }

    // Dispatch Enterprise Onboarding Notifications (Official Email + Personal Email + WhatsApp)
    if (input.sendInviteEmail !== false) {
      CentralNotificationEngine.notifyStaffOnboarded({
        staffId: result.staffProfile.id,
        employeeId,
        fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        officialEmail: primaryEmail,
        personalEmail: input.personalEmail?.trim() || undefined,
        whatsappNumber: input.whatsappNumber?.trim() || cleanPhone || undefined,
        department: String(input.department),
        designation: input.designation.trim(),
        roleCode: String(input.roleCode),
        actorId: actor.id,
      }).catch((err) => console.error("[StaffOnboardingService] Central notification error:", err));
    }

    return {
      success: true,
      employeeId,
      credentials: {
        fullName: `${result.user.firstName} ${result.user.lastName}`,
        email: primaryEmail,
        employeeId,
        temporaryPassword: tempPassword,
        phone: cleanPhone,
        department: input.department,
        designation: input.designation.trim(),
        profilePhoto: input.profilePhoto?.trim() || null,
        portalUrl: "https://lms.softlabglobal.com",
      },
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
   * Resends welcome email and WhatsApp credentials to an existing staff member
   */
  static async sendStaffWelcomeNotification(
    actor: AuthenticatedUser,
    staffId: string,
    customPassword?: string
  ) {
    const staff = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new TRPCError({ code: "NOT_FOUND", message: `Staff profile ${staffId} not found.` });
    }

    const tempPassword = customPassword || `SoftLab@${new Date().getFullYear()}!${randomBytes(3).toString("hex")}`;
    if (customPassword) {
      const hash = await bcrypt.hash(tempPassword, 10);
      await db.user.update({
        where: { id: staff.userId },
        data: { passwordHash: hash },
      });
    }

    const fullName = `${staff.user.firstName} ${staff.user.lastName}`;
    const primaryEmail = staff.user.email;
    const phone = staff.personalPhone || staff.user.phone || staff.user.whatsappNumber;

    // Send Enterprise Dual-Email & WhatsApp Notifications
    const dispatchRes = await CentralNotificationEngine.notifyStaffOnboarded({
      staffId: staff.id,
      employeeId: staff.employeeId,
      fullName,
      officialEmail: primaryEmail,
      personalEmail: staff.personalEmail || undefined,
      whatsappNumber: phone || undefined,
      department: String(staff.department),
      designation: staff.designation,
      roleCode: String(staff.user.roleCode),
      actorId: actor.id,
    });

    const emailSent = dispatchRes.sentCount > 0;
    const whatsappSent = dispatchRes.details.some((d) => d.channel === "WHATSAPP" && d.status === "SENT");
    return {
      success: dispatchRes.sentCount > 0,
      sentCount: dispatchRes.sentCount,
      failedCount: dispatchRes.failedCount,
      details: dispatchRes.details,
      emailSent,
      whatsappSent,
      message: `Dispatched ${dispatchRes.sentCount} notifications (${dispatchRes.failedCount} failures/simulated)`,
      temporaryPassword: tempPassword,
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

  /**
   * Admin-only idempotent repair for incomplete or orphaned staff onboarding records.
   * Ensures User, StaffProfile, TrainerProfile (if TRAINER), Checklist, LeaveBalance,
   * and EncryptedTemporaryCredential exist without creating duplicates.
   */
  static async repairIncompleteOnboarding(
    actor: AuthenticatedUser,
    params: {
      email: string;
      employeeId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      department?: StaffDepartment;
      designation?: string;
      roleCode?: UserRoleCode;
      branch?: string;
      baseSalary?: number;
      resetTempPassword?: boolean;
    }
  ) {
    const allowed: UserRoleCode[] = [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN, UserRoleCode.HR];
    if (!allowed.includes(actor.roleCode)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only Administrators and HR can repair staff onboarding." });
    }

    const cleanEmail = params.email.trim().toLowerCase();
    const cleanPhone = params.phone?.trim() || null;
    const roleCode = params.roleCode || UserRoleCode.TRAINER;
    const department = params.department || StaffDepartment.TRAINING;
    const designation = params.designation?.trim() || "Head Trainer";
    const firstName = params.firstName?.trim() || "Head";
    const lastName = params.lastName?.trim() || "Trainer";

    const tempPassword = generateSecureTempPassword("SLG");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const repaired = await db.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: cleanEmail } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: cleanEmail,
            phone: cleanPhone,
            callingNumber: cleanPhone,
            whatsappNumber: cleanPhone,
            passwordHash,
            firstName,
            lastName,
            roleCode,
            status: "ACTIVE",
          },
        });
      } else {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            roleCode,
            status: "ACTIVE",
            deletedAt: null,
            ...(params.resetTempPassword !== false ? { passwordHash } : {}),
          },
        });
      }

      let staff = await tx.staffProfile.findUnique({ where: { userId: user.id } });
      if (!staff && params.employeeId) {
        staff = await tx.staffProfile.findUnique({ where: { employeeId: params.employeeId.trim() } });
      }

      const targetEmpId = staff?.employeeId || params.employeeId?.trim() || (await this.generateEmployeeId());

      if (!staff) {
        staff = await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId: targetEmpId,
            department,
            designation,
            baseSalary: params.baseSalary ?? 4500000,
            joiningDate: new Date(),
            personalEmail: cleanEmail,
            personalPhone: cleanPhone,
            employmentType: "FULL_TIME",
            branch: params.branch || "PRAYAGRAJ_MAIN",
            workLocation: "PRAYAGRAJ_CAMPUS",
            employmentStatus: "ACTIVE",
            isActive: true,
          },
        });
      } else {
        staff = await tx.staffProfile.update({
          where: { id: staff.id },
          data: {
            userId: user.id,
            department,
            designation,
            employmentStatus: "ACTIVE",
            isActive: true,
          },
        });
      }

      await tx.staffOnboardingChecklist.upsert({
        where: { staffId: staff.id },
        update: { roleAssignmentDone: true, hrmsProfileDone: true, emailAccountCreated: true },
        create: {
          staffId: staff.id,
          personalDetailsDone: true,
          workstationAssigned: true,
          emailAccountCreated: true,
          slackOrPortalInvited: true,
          roleAssignmentDone: true,
          crmAccessVerified: true,
          hrmsProfileDone: true,
          managerApprovalDone: true,
          completionPercent: 75,
          status: "IN_PROGRESS",
        },
      });

      if (roleCode === UserRoleCode.TRAINER) {
        await tx.trainerProfile.upsert({
          where: { userId: user.id },
          update: { specializations: [designation] },
          create: { userId: user.id, specializations: [designation], experienceYears: 3 },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "STAFF_ONBOARDING_REPAIRED",
          resourceType: "StaffProfile",
          resourceId: staff.id,
          newData: { employeeId: staff.employeeId, email: cleanEmail, roleCode, designation, department },
        },
      });

      return { user, staff };
    });

    await AttendanceIntegrationService.getOrCreateLeaveBalances(repaired.staff.id);
    if (params.resetTempPassword !== false) {
      await CredentialSecurityService.storeEncryptedTempCredential({
        targetUserId: repaired.user.id,
        tempPassword,
        issuedById: actor.id,
        issuedReason: "ONBOARDING",
        ttlHours: 72,
      });
    }

    return {
      success: true,
      userId: repaired.user.id,
      staffId: repaired.staff.id,
      employeeId: repaired.staff.employeeId,
      email: repaired.user.email,
      roleCode: repaired.user.roleCode,
      temporaryPassword: params.resetTempPassword !== false ? tempPassword : null,
    };
  }
}
