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
}

export interface UpdateStaffProfileInput {
  department?: StaffDepartment;
  designation?: string;
  baseSalary?: number; // in integer Paise
  bankAccountNumber?: string;
  bankIfsc?: string;
  panNumber?: string;
  isActive?: boolean;
}

export interface ListStaffParams {
  department?: StaffDepartment;
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
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: cleanEmail,
          phone: cleanPhone,
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
   * Updates staff profile details, designations, and salary structures
   */
  static async updateStaffProfile(actor: AuthenticatedUser, staffId: string, input: UpdateStaffProfileInput) {
    const existing = await db.staffProfile.findUnique({
      where: { id: staffId },
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

    const updated = await db.staffProfile.update({
      where: { id: staffId },
      data: {
        department: input.department ?? undefined,
        designation: input.designation?.trim() ?? undefined,
        baseSalary: input.baseSalary ?? undefined,
        bankAccountNumber: input.bankAccountNumber !== undefined ? input.bankAccountNumber.trim() || null : undefined,
        bankIfsc: input.bankIfsc !== undefined ? input.bankIfsc.trim().toUpperCase() || null : undefined,
        panNumber: input.panNumber !== undefined ? input.panNumber.trim().toUpperCase() || null : undefined,
        isActive: input.isActive ?? undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleCode: true,
          },
        },
      },
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
   * Fetches staff profile by staff primary key
   */
  static async getStaffProfileById(staffId: string) {
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
            roleCode: true,
          },
        },
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
            roleCode: true,
          },
        },
      },
    });
  }

  /**
   * Lists staff members with departmental and status filtering
   */
  static async listStaffProfiles(params: ListStaffParams = {}) {
    const { department, isActive, search, page = 1, limit = 50 } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.StaffProfileWhereInput = {
      department: department ?? undefined,
      isActive: isActive !== undefined ? isActive : undefined,
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
