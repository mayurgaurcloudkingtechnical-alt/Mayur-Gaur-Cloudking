import { db } from "@/server/db/client";
import { StaffDepartment, UserRoleCode, Prisma } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { EmailService } from "@/server/services/email.service";

export interface CreateStaffMemberWithAccountInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roleCode: UserRoleCode;
  department: StaffDepartment;
  designation: string;
  baseSalary: number; // in Paise
  employeeId?: string;
  password?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  gender?: string;
  workLocation?: string;
  callingNumber?: string;
  whatsappNumber?: string;
  reportingManagerId?: string;
}

export interface CreateStaffProfileInput {
  userId: string;
  employeeId?: string;
  department: StaffDepartment;
  designation: string;
  joiningDate?: Date;
  baseSalary: number; // in integer Paise
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  reportingManagerId?: string;
}

export interface StaffDocumentPayload {
  id?: string;
  documentType: string;
  title: string;
  documentUrl: string;
  fileName?: string;
  fileSize?: number;
  isVerified?: boolean;
}

export interface UpdateStaffProfileInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  callingNumber?: string;
  whatsappNumber?: string;
  personalEmail?: string;
  personalPhone?: string;
  department?: StaffDepartment;
  designation?: string;
  baseSalary?: number; // in integer Paise
  employmentType?: string;
  workLocation?: string;
  branch?: string;
  residentialAddress?: string;
  profilePhoto?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  reportingManagerId?: string | null;
  shiftId?: string | null;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  gender?: string;
  dateOfBirth?: Date;
  joiningDate?: Date;
  isActive?: boolean;
  documents?: StaffDocumentPayload[];
}

export interface ListStaffParams {
  department?: StaffDepartment;
  reportingManagerId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class StaffProfileService {
  /**
   * Generates a deterministic, sequential employee ID (e.g. SLG-EMP-0101)
   */
  private static async generateEmployeeId(): Promise<string> {
    const totalCount = await db.staffProfile.count();
    let sequence = totalCount + 101;
    let employeeId = `SLG-EMP-${String(sequence).padStart(4, "0")}`;

    while (await db.staffProfile.findUnique({ where: { employeeId } })) {
      sequence += 1;
      employeeId = `SLG-EMP-${String(sequence).padStart(4, "0")}`;
    }
    return employeeId;
  }

  /**
   * Automatically ensures that every institutional user account has an active StaffProfile
   * and live reporting hierarchy connections.
   */
  static async ensureStaffProfilesExist() {
    try {
      const usersWithoutProfile = await db.user.findMany({
        where: {
          roleCode: { notIn: [UserRoleCode.STUDENT] },
          staffProfile: null,
        },
      });

      if (usersWithoutProfile.length > 0) {
        for (const user of usersWithoutProfile) {
          let dept: StaffDepartment = StaffDepartment.COUNSELING;
          let desig = "Staff Member";
          let prefix = "EMP";
          let baseSalary = 3500000;

          switch (user.roleCode) {
            case UserRoleCode.DIRECTOR:
              dept = StaffDepartment.MANAGEMENT;
              desig = "Executive Director & Managing Authority";
              prefix = "DIR";
              baseSalary = 10000000;
              break;
            case UserRoleCode.SUPER_ADMIN:
              dept = StaffDepartment.MANAGEMENT;
              desig = "Director & Chief Administrator";
              prefix = "DIR";
              baseSalary = 10000000;
              break;
            case UserRoleCode.ADMIN:
              dept = StaffDepartment.OPERATIONS;
              desig = "Operations Administrator";
              prefix = "ADM";
              baseSalary = 6000000;
              break;
            case UserRoleCode.MANAGER:
              dept = StaffDepartment.OPERATIONS;
              desig = "Academic & Branch Operations Manager";
              prefix = "MGR";
              baseSalary = 5500000;
              break;
            case UserRoleCode.HR:
              dept = StaffDepartment.HR;
              desig = "Human Resources & Talent Lead";
              prefix = "HR";
              baseSalary = 4500000;
              break;
            case UserRoleCode.ACCOUNTANT:
              dept = StaffDepartment.FINANCE;
              desig = "Senior Accounts & Finance Officer";
              prefix = "ACC";
              baseSalary = 4500000;
              break;
            case UserRoleCode.TRAINER:
              dept = StaffDepartment.TRAINING;
              desig = "Senior Technical Faculty / Lead Trainer";
              prefix = "TRN";
              baseSalary = 5000000;
              break;
            case UserRoleCode.COUNSELOR:
              dept = StaffDepartment.COUNSELING;
              desig = "Senior Academic Counselor";
              prefix = "CNS";
              baseSalary = 4000000;
              break;
            case UserRoleCode.TELECALLER:
              dept = StaffDepartment.TELECALLING;
              desig = "Telecalling & Admissions Executive";
              prefix = "TEL";
              baseSalary = 2500000;
              break;
          }

          const count = await db.staffProfile.count();
          const employeeId = `SLG-${prefix}-2026-${String(count + 101).padStart(4, "0")}`;

          await db.staffProfile.create({
            data: {
              userId: user.id,
              employeeId,
              department: dept,
              designation: desig,
              baseSalary,
              personalEmail: user.email,
              personalPhone: user.phone || null,
              workLocation: "PRAYAGRAJ_CAMPUS",
              branch: "PRAYAGRAJ_MAIN",
              isActive: true,
            },
          });
        }
      }

      // Connect standard reporting lines if unlinked
      const director = await db.staffProfile.findFirst({
        where: {
          user: { roleCode: { in: [UserRoleCode.DIRECTOR, UserRoleCode.SUPER_ADMIN] } },
          isActive: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const headCounselor = await db.staffProfile.findFirst({
        where: {
          user: { email: "shikha.verma@softlabglobal.com" },
          isActive: true,
        },
      });

      if (director && headCounselor && !headCounselor.reportingManagerId) {
        await db.staffProfile.update({
          where: { id: headCounselor.id },
          data: { reportingManagerId: director.id },
        });
      }

      if (headCounselor) {
        await db.staffProfile.updateMany({
          where: {
            department: { in: [StaffDepartment.COUNSELING, StaffDepartment.TELECALLING] },
            id: { notIn: [headCounselor.id, ...(director ? [director.id] : [])] },
            reportingManagerId: null,
          },
          data: { reportingManagerId: headCounselor.id },
        });
      }
    } catch (err) {
      console.error("[StaffProfileService] ensureStaffProfilesExist notice:", err);
    }
  }

  /**
   * Phase 6: Complete Staff Onboarding creating User account, StaffProfile, and credentials in one step.
   */
  static async createStaffMemberWithAccount(
    actor: AuthenticatedUser,
    input: CreateStaffMemberWithAccountInput
  ) {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone?.trim() || null;

    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email: cleanEmail },
          ...(cleanPhone ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `An account already exists with this email (${cleanEmail}) or phone number.`,
      });
    }

    const employeeId = input.employeeId?.trim() || (await this.generateEmployeeId());
    const existingEmp = await db.staffProfile.findUnique({ where: { employeeId } });
    if (existingEmp) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Employee ID ${employeeId} is already in use.`,
      });
    }

    // Generate secure temporary password if not provided
    const tempPassword = input.password?.trim() || `SoftLab@${new Date().getFullYear()}!${randomBytes(3).toString("hex")}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const result = await db.$transaction(async (tx) => {
      const assignedCalling = input.callingNumber?.trim() || cleanPhone;
      const assignedWhatsapp = input.whatsappNumber?.trim() || cleanPhone;

      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhone,
          callingNumber: assignedCalling,
          whatsappNumber: assignedWhatsapp,
          passwordHash,
          firstName: input.firstName.trim(),
          lastName: input.lastName.trim(),
          roleCode: input.roleCode,
        },
      });

      // 2. Create StaffProfile
      const staffProfile = await tx.staffProfile.create({
        data: {
          userId: user.id,
          employeeId,
          department: input.department,
          designation: input.designation.trim(),
          baseSalary: input.baseSalary,
          bankAccountNumber: input.bankAccountNumber?.trim() || null,
          bankIfsc: input.bankIfsc?.trim().toUpperCase() || null,
          panNumber: input.panNumber?.trim().toUpperCase() || null,
          gender: input.gender || null,
          workLocation: input.workLocation || "PRAYAGRAJ_CAMPUS",
          reportingManagerId: input.reportingManagerId || null,
          isActive: true,
        },
      });

      // 3. If Trainer, also create TrainerProfile
      if (input.roleCode === UserRoleCode.TRAINER) {
        await tx.trainerProfile.create({
          data: {
            userId: user.id,
            specializations: [input.designation],
            experienceYears: 1,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "STAFF_CREATED_WITH_LOGIN",
          resourceType: "StaffProfile",
          resourceId: staffProfile.id,
          newData: {
            userId: user.id,
            employeeId,
            email: user.email,
            roleCode: user.roleCode,
            department: staffProfile.department,
            designation: staffProfile.designation,
          },
        },
      });

      return { user, staffProfile };
    }, { maxWait: 15000, timeout: 30000 });

    // 5. Asynchronously trigger staff credentials email notification
    EmailService.sendStaffCredentials({
      to: cleanEmail,
      staffName: `${input.firstName.trim()} ${input.lastName.trim()}`,
      employeeId,
      loginEmail: cleanEmail,
      temporaryPassword: tempPassword,
      roleName: input.roleCode,
      designation: input.designation.trim(),
    }).catch((err) => console.error("[StaffService] Email dispatch notice:", err));

    return {
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        roleCode: result.user.roleCode,
      },
      staffProfile: result.staffProfile,
      credentials: {
        email: cleanEmail,
        temporaryPassword: tempPassword,
        employeeId,
        roleCode: input.roleCode,
        fullName: `${input.firstName.trim()} ${input.lastName.trim()}`,
        phone: cleanPhone,
        callingNumber: result.user.callingNumber,
        whatsappNumber: result.user.whatsappNumber,
      },
    };
  }

  /**
   * Reset staff password and return new temporary password.
   */
  static async resetStaffPassword(actor: AuthenticatedUser, staffId: string) {
    const profile = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Staff profile '${staffId}' not found.`,
      });
    }

    const tempPassword = `SoftLab@${new Date().getFullYear()}!${randomBytes(3).toString("hex")}`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await db.user.update({
      where: { id: profile.userId },
      data: { passwordHash },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFF_PASSWORD_RESET",
      resourceType: "StaffProfile",
      resourceId: staffId,
      newData: { email: profile.user.email },
    });

    // Dispatch email
    EmailService.sendStaffCredentials({
      to: profile.user.email,
      staffName: `${profile.user.firstName} ${profile.user.lastName}`,
      employeeId: profile.employeeId,
      loginEmail: profile.user.email,
      temporaryPassword: tempPassword,
      roleName: profile.user.roleCode,
      designation: profile.designation,
    }).catch((err) => console.error("[StaffService] Reset email dispatch:", err));

    return {
      success: true,
      email: profile.user.email,
      temporaryPassword: tempPassword,
      employeeId: profile.employeeId,
    };
  }

  /**
   * Onboards a staff member with a profile and compensation record in integer Paise
   */
  static async createStaffProfile(actor: AuthenticatedUser, input: CreateStaffProfileInput) {
    const user = await db.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User with ID ${input.userId} does not exist.`,
      });
    }

    const existingProfile = await db.staffProfile.findUnique({
      where: { userId: input.userId },
    });

    if (existingProfile) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `User already has an existing staff profile (${existingProfile.employeeId}).`,
      });
    }

    const employeeId = input.employeeId?.trim() || (await this.generateEmployeeId());

    const duplicateEmpId = await db.staffProfile.findUnique({
      where: { employeeId },
    });

    if (duplicateEmpId) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Employee ID ${employeeId} is already in use.`,
      });
    }

    if (input.baseSalary < 0 || !Number.isInteger(input.baseSalary)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Base salary must be a positive integer in Paise.",
      });
    }

    const profile = await db.staffProfile.create({
      data: {
        userId: input.userId,
        employeeId,
        department: input.department,
        designation: input.designation.trim(),
        joiningDate: input.joiningDate ?? new Date(),
        baseSalary: input.baseSalary,
        bankAccountNumber: input.bankAccountNumber?.trim() || null,
        bankIfsc: input.bankIfsc?.trim().toUpperCase() || null,
        panNumber: input.panNumber?.trim().toUpperCase() || null,
        reportingManagerId: input.reportingManagerId || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            roleCode: true,
          },
        },
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFF_PROFILE_CREATED",
      resourceType: "StaffProfile",
      resourceId: profile.id,
      newData: {
        employeeId: profile.employeeId,
        department: profile.department,
        designation: profile.designation,
        baseSalary: profile.baseSalary,
      },
    });

    return profile;
  }

  /**
   * Updates staff profile details, user credentials, designations, and salary structures
   */
  static async updateStaffProfile(actor: AuthenticatedUser, staffId: string, input: UpdateStaffProfileInput) {
    const existing = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Staff profile ${staffId} not found.`,
      });
    }

    if (input.baseSalary !== undefined && (input.baseSalary < 0 || !Number.isInteger(input.baseSalary))) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Base salary must be a positive integer in Paise.",
      });
    }

    // Atomic update of user and staffProfile
    const updated = await db.$transaction(async (tx) => {
      // 1. Update user record if user fields are passed
      const userData: any = {};
      if (input.firstName !== undefined) userData.firstName = input.firstName.trim();
      if (input.lastName !== undefined) userData.lastName = input.lastName.trim();
      if (input.email !== undefined) userData.email = input.email.trim().toLowerCase();
      if (input.phone !== undefined) userData.phone = input.phone.trim();
      if (input.callingNumber !== undefined) userData.callingNumber = input.callingNumber.trim() || null;
      if (input.whatsappNumber !== undefined) userData.whatsappNumber = input.whatsappNumber.trim() || null;
      if (input.profilePhoto !== undefined) userData.avatarUrl = input.profilePhoto.trim();

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData,
        });
      }

      // 2. Synchronize staff documents if provided
      if (input.documents !== undefined) {
        const providedIds = input.documents
          .map((d) => d.id)
          .filter((id): id is string => Boolean(id));

        // Delete documents removed in this edit
        await tx.staffDocument.deleteMany({
          where: {
            staffId,
            ...(providedIds.length > 0 ? { id: { notIn: providedIds } } : {}),
          },
        });

        // Insert new documents or update existing
        for (const doc of input.documents) {
          if (doc.id) {
            await tx.staffDocument.update({
              where: { id: doc.id },
              data: {
                title: doc.title.trim(),
                documentType: doc.documentType.trim(),
                documentUrl: doc.documentUrl.trim(),
                fileName: doc.fileName || null,
                fileSize: doc.fileSize || null,
                isVerified: doc.isVerified ?? false,
              },
            });
          } else if (doc.documentUrl) {
            await tx.staffDocument.create({
              data: {
                staffId,
                title: doc.title.trim(),
                documentType: doc.documentType.trim(),
                documentUrl: doc.documentUrl.trim(),
                fileName: doc.fileName || null,
                fileSize: doc.fileSize || null,
                isVerified: doc.isVerified ?? false,
              },
            });
          }
        }
      }

      // 3. Update staff profile
      return tx.staffProfile.update({
        where: { id: staffId },
        data: {
          department: input.department ?? undefined,
          designation: input.designation?.trim() ?? undefined,
          baseSalary: input.baseSalary ?? undefined,
          employmentType: input.employmentType?.trim() ?? undefined,
          workLocation: input.workLocation?.trim() ?? undefined,
          branch: input.branch?.trim() ?? undefined,
          residentialAddress: input.residentialAddress?.trim() ?? undefined,
          personalEmail: input.personalEmail !== undefined ? input.personalEmail.trim().toLowerCase() || null : undefined,
          personalPhone: input.personalPhone !== undefined ? input.personalPhone.trim() || null : undefined,
          profilePhoto: input.profilePhoto !== undefined ? input.profilePhoto.trim() || null : undefined,
          bankAccountNumber: input.bankAccountNumber !== undefined ? input.bankAccountNumber.trim() || null : undefined,
          bankIfsc: input.bankIfsc !== undefined ? input.bankIfsc.trim().toUpperCase() || null : undefined,
          panNumber: input.panNumber !== undefined ? input.panNumber.trim().toUpperCase() || null : undefined,
          reportingManagerId: input.reportingManagerId !== undefined ? (input.reportingManagerId || null) : undefined,
          shiftId: input.shiftId !== undefined ? (input.shiftId || null) : undefined,
          emergencyContactName: input.emergencyContactName !== undefined ? input.emergencyContactName.trim() || null : undefined,
          emergencyContactPhone: input.emergencyContactPhone !== undefined ? input.emergencyContactPhone.trim() || null : undefined,
          gender: input.gender ?? undefined,
          dateOfBirth: input.dateOfBirth ?? undefined,
          joiningDate: input.joiningDate ?? undefined,
          isActive: input.isActive ?? undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              callingNumber: true,
              whatsappNumber: true,
              avatarUrl: true,
              roleCode: true,
              status: true,
            },
          },
          reportingManager: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  roleCode: true,
                },
              },
            },
          },
          shift: true,
          documents: {
            orderBy: { uploadedAt: "desc" },
          },
        },
      });
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFF_PROFILE_UPDATED",
      resourceType: "StaffProfile",
      resourceId: updated.id,
      previousData: {
        designation: existing.designation,
        baseSalary: existing.baseSalary,
        isActive: existing.isActive,
      },
      newData: {
        designation: updated.designation,
        baseSalary: updated.baseSalary,
        isActive: updated.isActive,
      },
    });

    return updated;
  }

  /**
   * Permanently deletes a staff member and all associated records with audit log
   */
  static async deleteStaffProfile(actor: AuthenticatedUser, staffId: string) {
    const staff = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Staff profile ${staffId} not found.`,
      });
    }

    await db.$transaction(async (tx) => {
      // 1. Delete dependent daily work items & reports
      await tx.dailyWorkReportItem.deleteMany({
        where: { report: { staffId } },
      });
      await tx.dailyWorkReport.deleteMany({ where: { staffId } });

      // 2. Delete tasks & status histories
      await tx.taskStatusHistory.deleteMany({
        where: { task: { assignedStaffId: staffId } },
      });
      await tx.dailyWorkTask.deleteMany({ where: { assignedStaffId: staffId } });
      await tx.staffTask.deleteMany({ where: { assignedStaffId: staffId } });

      // 3. Delete attendance events & attendances
      await tx.attendanceEvent.deleteMany({
        where: { OR: [{ staffId }, { userId: staff.userId }] },
      });
      await tx.attendanceRegularizationRequest.deleteMany({ where: { staffId } });
      await tx.overtimeRequest.deleteMany({ where: { staffId } });
      await tx.staffAttendance.deleteMany({ where: { staffId } });

      // 4. Delete leave balances & requests
      await tx.leaveBalance.deleteMany({ where: { staffId } });
      await tx.leaveRequest.deleteMany({ where: { staffId } });

      // 5. Delete documents & checklists
      await tx.staffDocument.deleteMany({ where: { staffId } });
      await tx.staffOnboardingChecklist.deleteMany({ where: { staffId } });
      await tx.staffOffboardingRecord.deleteMany({ where: { staffId } });

      // 6. Delete other staff records (payroll, assets, reviews)
      await tx.payrollRecord.deleteMany({ where: { staffId } });
      await tx.staffPerformanceReview.deleteMany({ where: { staffId } });
      await tx.staffAsset.deleteMany({ where: { assignedStaffId: staffId } });

      // 7. Delete staff profile
      await tx.staffProfile.delete({ where: { id: staffId } });

      // 8. Delete user account
      await tx.user.delete({ where: { id: staff.userId } });
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFF_PROFILE_DELETED",
      resourceType: "StaffProfile",
      resourceId: staffId,
      previousData: {
        employeeId: staff.employeeId,
        email: staff.user.email,
        name: `${staff.user.firstName} ${staff.user.lastName}`,
      },
    });

    return { success: true, message: `Staff member ${staff.employeeId} has been successfully deleted.` };
  }

  /**
   * Fetches staff profile with all relational data including documents, reporting manager, shift, and onboarding
   */
  static async getStaffProfileById(staffId: string) {
    return this.getStaffFullProfile(staffId);
  }

  /**
   * Fetches comprehensive staff profile for admin/director viewing and editing
   */
  static async getStaffFullProfile(staffId: string) {
    const profile = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            callingNumber: true,
            whatsappNumber: true,
            avatarUrl: true,
            roleCode: true,
            status: true,
            createdAt: true,
          },
        },
        reportingManager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                roleCode: true,
              },
            },
          },
        },
        shift: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        onboardingChecklist: true,
      },
    });

    if (!profile) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Staff profile ${staffId} not found.`,
      });
    }
    return profile;
  }

  /**
   * Fetches staff profile by associated User ID
   */
  static async getStaffProfileByUserId(userId: string) {
    await this.ensureStaffProfilesExist();
    return db.staffProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            callingNumber: true,
            whatsappNumber: true,
            roleCode: true,
          },
        },
        reportingManager: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                roleCode: true,
              },
            },
          },
        },
        shift: true,
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        onboardingChecklist: true,
      },
    });
  }

  /**
   * Returns current authenticated user's self profile with all credentials and documents
   */
  static async getMyStaffProfile(userId: string) {
    await this.ensureStaffProfilesExist();
    return this.getStaffProfileByUserId(userId);
  }

  /**
   * Lists staff members with departmental and status filtering
   */
  static async listStaffProfiles(params: ListStaffParams = {}) {
    await this.ensureStaffProfilesExist();
    const { department, reportingManagerId, isActive, search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StaffProfileWhereInput = {
      department: department ?? undefined,
      isActive: isActive !== undefined ? isActive : undefined,
      ...(reportingManagerId && reportingManagerId !== "ALL"
        ? {
            reportingManagerId: reportingManagerId === "UNASSIGNED" ? null : reportingManagerId,
          }
        : {}),
      ...(search
        ? {
            OR: [
              { employeeId: { contains: search, mode: "insensitive" } },
              { designation: { contains: search, mode: "insensitive" } },
              { user: { firstName: { contains: search, mode: "insensitive" } } },
              { user: { lastName: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      db.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              roleCode: true,
              avatarUrl: true,
              status: true,
            },
          },
          reportingManager: {
            select: {
              id: true,
              employeeId: true,
              designation: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  roleCode: true,
                },
              },
            },
          },
        },
      }),
      db.staffProfile.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetches all potential managers and directors for reporting manager dropdowns
   */
  static async listPotentialReportingManagers() {
    await this.ensureStaffProfilesExist();
    return db.staffProfile.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        employeeId: true,
        department: true,
        designation: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roleCode: true,
          },
        },
        _count: {
          select: { subordinates: true },
        },
      },
      orderBy: [{ user: { firstName: "asc" } }],
    });
  }

  /**
   * Computes high-level staff statistics
   */
  static async getStaffMetrics() {
    const [totalActive, totalInactive, deptCounts] = await Promise.all([
      db.staffProfile.count({ where: { isActive: true } }),
      db.staffProfile.count({ where: { isActive: false } }),
      db.staffProfile.groupBy({
        by: ["department"],
        where: { isActive: true },
        _count: { _all: true },
      }),
    ]);

    return {
      totalActive,
      totalInactive,
      totalStaff: totalActive + totalInactive,
      byDepartment: deptCounts.map((d) => ({
        department: d.department,
        count: d._count._all,
      })),
    };
  }
}
