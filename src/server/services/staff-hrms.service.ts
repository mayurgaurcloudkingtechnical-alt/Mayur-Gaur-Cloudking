import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { UserRoleCode } from "@prisma/client";

export interface DepartmentInput {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface DesignationInput {
  departmentId: string;
  title: string;
  code?: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

export interface MarkAttendanceInput {
  staffId: string;
  date: Date;
  status: string; // PRESENT, ABSENT, HALF_DAY, LATE, WORK_FROM_HOME, ON_DUTY, LEAVE
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  remarks?: string;
}

export interface CreateStaffTaskInput {
  staffId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: string;
}

export interface PerformanceReviewInput {
  staffId: string;
  reviewPeriod: string;
  rating: number;
  kpisScore?: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  status?: string;
}

export interface StaffDocumentInput {
  staffId: string;
  title: string;
  docType: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
}

export class StaffHrmsService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.HR;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage HRMS operations.",
      });
    }
  }

  // ==========================================
  // DEPARTMENTS & DESIGNATIONS
  // ==========================================
  static async listDepartments() {
    return db.staffDepartmentEntity.findMany({
      include: {
        designations: { where: { isActive: true } },
        _count: { select: { designations: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  static async createDepartment(user: AuthenticatedUser, input: DepartmentInput) {
    this.checkCanManage(user);

    const existing = await db.staffDepartmentEntity.findUnique({
      where: { code: input.code.toUpperCase().trim() },
    });
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Department code ${input.code} already exists.`,
      });
    }

    const dept = await db.staffDepartmentEntity.create({
      data: {
        code: input.code.toUpperCase().trim(),
        name: input.name.trim(),
        description: input.description?.trim(),
        isActive: input.isActive ?? true,
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "HRMS_DEPARTMENT_CREATED",
      resourceType: "StaffDepartmentEntity",
      resourceId: dept.id,
      newData: { code: dept.code, name: dept.name },
    });

    return dept;
  }

  static async updateDepartment(
    user: AuthenticatedUser,
    id: string,
    data: Partial<DepartmentInput>
  ) {
    this.checkCanManage(user);

    return db.staffDepartmentEntity.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  static async listDesignations(departmentId?: string) {
    return db.staffDesignation.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ level: "asc" }, { title: "asc" }],
    });
  }

  static async createDesignation(user: AuthenticatedUser, input: DesignationInput) {
    this.checkCanManage(user);

    const desigCode =
      input.code?.toUpperCase().trim() ||
      `${input.title.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`;

    const desig = await db.staffDesignation.create({
      data: {
        departmentId: input.departmentId,
        code: desigCode,
        title: input.title.trim(),
        level: input.level ?? 1,
        description: input.description?.trim(),
        isActive: input.isActive ?? true,
      },
      include: { department: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "HRMS_DESIGNATION_CREATED",
      resourceType: "StaffDesignation",
      resourceId: desig.id,
      newData: { title: desig.title, department: desig.department?.name },
    });

    return desig;
  }

  static async updateDesignation(
    user: AuthenticatedUser,
    id: string,
    data: Partial<DesignationInput>
  ) {
    this.checkCanManage(user);

    return db.staffDesignation.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.level !== undefined && { level: data.level }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // ==========================================
  // STAFF DAILY & MONTHLY ATTENDANCE
  // ==========================================
  static async markAttendance(user: AuthenticatedUser, input: MarkAttendanceInput) {
    this.checkCanManage(user);

    const startOfDay = new Date(input.date);
    startOfDay.setHours(0, 0, 0, 0);

    const checkIn = input.checkInTime ? new Date(`${input.date.toISOString().split("T")[0]}T${input.checkInTime}`) : undefined;
    const checkOut = input.checkOutTime ? new Date(`${input.date.toISOString().split("T")[0]}T${input.checkOutTime}`) : undefined;

    const record = await db.staffAttendance.upsert({
      where: {
        staffId_date: {
          staffId: input.staffId,
          date: startOfDay,
        },
      },
      create: {
        staffId: input.staffId,
        date: startOfDay,
        status: input.status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        workingHours: input.workingHours,
        remarks: input.remarks?.trim(),
        verifiedById: user.id,
      },
      update: {
        status: input.status,
        ...(checkIn !== undefined && { checkInTime: checkIn }),
        ...(checkOut !== undefined && { checkOutTime: checkOut }),
        ...(input.workingHours !== undefined && { workingHours: input.workingHours }),
        ...(input.remarks !== undefined && { remarks: input.remarks.trim() }),
        verifiedById: user.id,
      },
    });

    return record;
  }

  static async bulkMarkAttendance(
    user: AuthenticatedUser,
    date: Date,
    records: {
      staffId: string;
      status: string;
      checkInTime?: string;
      checkOutTime?: string;
      remarks?: string;
    }[]
  ) {
    this.checkCanManage(user);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const results = await Promise.all(
      records.map((r) => {
        const checkIn = r.checkInTime ? new Date(`${date.toISOString().split("T")[0]}T${r.checkInTime}`) : undefined;
        const checkOut = r.checkOutTime ? new Date(`${date.toISOString().split("T")[0]}T${r.checkOutTime}`) : undefined;

        return db.staffAttendance.upsert({
          where: {
            staffId_date: {
              staffId: r.staffId,
              date: startOfDay,
            },
          },
          create: {
            staffId: r.staffId,
            date: startOfDay,
            status: r.status,
            checkInTime: checkIn,
            checkOutTime: checkOut,
            remarks: r.remarks?.trim(),
            verifiedById: user.id,
          },
          update: {
            status: r.status,
            ...(checkIn !== undefined && { checkInTime: checkIn }),
            ...(checkOut !== undefined && { checkOutTime: checkOut }),
            ...(r.remarks !== undefined && { remarks: r.remarks.trim() }),
            verifiedById: user.id,
          },
        });
      })
    );

    return results;
  }

  static async listAttendance(params?: {
    month?: number;
    year?: number;
    date?: Date;
    staffId?: string;
  }) {
    let dateFilter: any = undefined;

    if (params?.date) {
      const start = new Date(params.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(params.date);
      end.setHours(23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (params?.month && params?.year) {
      const start = new Date(params.year, params.month - 1, 1);
      const end = new Date(params.year, params.month, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }

    return db.staffAttendance.findMany({
      where: {
        ...(params?.staffId ? { staffId: params.staffId } : {}),
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  static async getMonthlyAttendanceSummary(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const attendances = await db.staffAttendance.findMany({
      where: {
        date: { gte: start, lte: end },
      },
      select: {
        staffId: true,
        status: true,
      },
    });

    const summaryMap: Record<
      string,
      {
        present: number;
        absent: number;
        halfDay: number;
        onLeave: number;
        late: number;
        total: number;
      }
    > = {};

    attendances.forEach((a) => {
      if (!summaryMap[a.staffId]) {
        summaryMap[a.staffId] = {
          present: 0,
          absent: 0,
          halfDay: 0,
          onLeave: 0,
          late: 0,
          total: 0,
        };
      }
      summaryMap[a.staffId].total += 1;
      if (a.status === "PRESENT") summaryMap[a.staffId].present += 1;
      else if (a.status === "ABSENT") summaryMap[a.staffId].absent += 1;
      else if (a.status === "HALF_DAY") summaryMap[a.staffId].halfDay += 1;
      else if (a.status === "LEAVE" || a.status === "ON_LEAVE") summaryMap[a.staffId].onLeave += 1;
      else if (a.status === "LATE") summaryMap[a.staffId].late += 1;
    });

    return summaryMap;
  }

  // ==========================================
  // STAFF TASKS
  // ==========================================
  static async listStaffTasks(params?: { staffId?: string; status?: string }) {
    return db.staffTask.findMany({
      where: {
        ...(params?.staffId ? { assignedStaffId: params.staffId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      include: {
        assignedStaff: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        createdBy: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createStaffTask(user: AuthenticatedUser, input: CreateStaffTaskInput) {
    this.checkCanManage(user);

    const task = await db.staffTask.create({
      data: {
        assignedStaffId: input.staffId,
        createdById: user.id,
        title: input.title.trim(),
        description: input.description?.trim(),
        dueDate: input.dueDate,
        priority: input.priority || "MEDIUM",
        status: "PENDING",
      },
      include: { assignedStaff: { include: { user: true } } },
    });

    return task;
  }

  static async updateStaffTaskStatus(
    taskId: string,
    status: string,
    completionPercentage?: number
  ) {
    return db.staffTask.update({
      where: { id: taskId },
      data: {
        status,
        ...(completionPercentage !== undefined && { completionPercentage }),
      },
    });
  }

  // ==========================================
  // PERFORMANCE REVIEWS
  // ==========================================
  static async listPerformanceReviews(staffId?: string) {
    return db.staffPerformanceReview.findMany({
      where: staffId ? { staffId } : undefined,
      include: {
        staff: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        reviewer: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createPerformanceReview(user: AuthenticatedUser, input: PerformanceReviewInput) {
    this.checkCanManage(user);

    const review = await db.staffPerformanceReview.create({
      data: {
        staffId: input.staffId,
        reviewerId: user.id,
        reviewPeriod: input.reviewPeriod.trim(),
        rating: input.rating,
        kpis: input.kpisScore ? { score: input.kpisScore } : undefined,
        managerFeedback: input.improvements?.trim(),
        selfAssessment: input.strengths?.trim(),
        status: input.status || "COMPLETED",
      },
      include: { staff: { include: { user: true } } },
    });

    return review;
  }

  // ==========================================
  // HR DOCUMENTS
  // ==========================================
  static async listStaffDocuments(staffId: string) {
    return db.staffDocument.findMany({
      where: { staffId },
      include: {
        verifiedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { uploadedAt: "desc" },
    });
  }

  static async uploadStaffDocument(user: AuthenticatedUser, input: StaffDocumentInput) {
    const isOwner = await db.staffProfile.findFirst({
      where: { id: input.staffId, userId: user.id },
    });

    const isAuthorized =
      isOwner ||
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.HR;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Cannot upload document for this staff member.",
      });
    }

    const doc = await db.staffDocument.create({
      data: {
        staffId: input.staffId,
        title: input.title.trim(),
        documentType: input.docType.trim(),
        documentUrl: input.fileUrl.trim(),
        fileName: input.fileName?.trim(),
        fileSize: input.fileSize,
        isVerified: false,
      },
    });

    return doc;
  }

  static async verifyStaffDocument(user: AuthenticatedUser, docId: string, isVerified: boolean) {
    this.checkCanManage(user);

    return db.staffDocument.update({
      where: { id: docId },
      data: {
        isVerified,
        verifiedById: user.id,
        verifiedAt: new Date(),
      },
    });
  }
}
