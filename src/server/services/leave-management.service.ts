import { db } from "@/server/db/client";
import { LeaveType, LeaveRequestStatus, StaffDepartment, Prisma } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

export interface ApplyLeaveInput {
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
  daysCount?: number;
}

export interface ReviewLeaveInput {
  status: typeof LeaveRequestStatus.APPROVED | typeof LeaveRequestStatus.REJECTED;
  rejectionReason?: string;
}

export interface ListLeavesFilter {
  status?: LeaveRequestStatus;
  department?: StaffDepartment;
  staffId?: string;
  page?: number;
  limit?: number;
}

export class LeaveManagementService {
  /**
   * Submits a new leave application with date validation and concurrency overlap checks
   */
  static async applyForLeave(staffId: string, input: ApplyLeaveInput) {
    const staff = await db.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!staff) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Staff profile not found.",
      });
    }

    if (!staff.isActive) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Inactive staff members cannot apply for leave.",
      });
    }

    const start = new Date(input.startDate);
    const end = new Date(input.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid start or end date format.",
      });
    }

    if (start > end) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Leave start date cannot be after end date.",
      });
    }

    // Overlap validation: prevent multiple pending or approved requests overlapping same date window
    const overlapping = await db.leaveRequest.findFirst({
      where: {
        staffId,
        status: { in: [LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
    });

    if (overlapping) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Overlapping leave request already exists from ${overlapping.startDate.toISOString().slice(0, 10)} to ${overlapping.endDate.toISOString().slice(0, 10)} (Status: ${overlapping.status}).`,
      });
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
    const daysCount = input.daysCount && input.daysCount > 0 ? input.daysCount : Math.max(1, diffDays);

    const leave = await db.leaveRequest.create({
      data: {
        staffId,
        leaveType: input.leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason: input.reason.trim(),
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        staff: {
          select: {
            employeeId: true,
            department: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    await AuditService.log({
      actorId: staff.userId,
      action: "LEAVE_APPLIED",
      resourceType: "LeaveRequest",
      resourceId: leave.id,
      newData: {
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        daysCount: leave.daysCount,
      },
    });

    return leave;
  }

  /**
   * Reviews and approves or rejects a leave request
   */
  static async reviewLeaveRequest(actor: AuthenticatedUser, leaveRequestId: string, input: ReviewLeaveInput) {
    const leave = await db.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        staff: {
          select: {
            userId: true,
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!leave) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Leave request ${leaveRequestId} not found.`,
      });
    }

    if (leave.status !== LeaveRequestStatus.PENDING) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Leave request has already been ${leave.status.toLowerCase()}.`,
      });
    }

    if (input.status === LeaveRequestStatus.REJECTED && !input.rejectionReason?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A rejection reason is required when rejecting a leave request.",
      });
    }

    const updated = await db.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: input.status,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        rejectionReason: input.status === LeaveRequestStatus.REJECTED ? input.rejectionReason?.trim() : null,
      },
      include: {
        staff: {
          select: {
            employeeId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        reviewedBy: {
          select: { firstName: true, lastName: true, roleCode: true },
        },
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: `LEAVE_${input.status}`,
      resourceType: "LeaveRequest",
      resourceId: updated.id,
      previousData: { status: leave.status },
      newData: {
        status: updated.status,
        reviewedById: actor.id,
        rejectionReason: updated.rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Staff self-service cancellation for pending leave requests
   */
  static async cancelLeaveRequest(staffId: string, leaveRequestId: string) {
    const leave = await db.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!leave) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Leave request not found.",
      });
    }

    if (leave.staffId !== staffId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only cancel your own leave requests.",
      });
    }

    if (leave.status !== LeaveRequestStatus.PENDING) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot cancel leave request that is already ${leave.status.toLowerCase()}.`,
      });
    }

    return db.leaveRequest.update({
      where: { id: leaveRequestId },
      data: { status: LeaveRequestStatus.CANCELLED },
    });
  }

  /**
   * Computes approved UNPAID leave days for a staff member in a specified calendar month
   */
  static async getApprovedUnpaidLeaveDays(staffId: string, month: number, year: number): Promise<number> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const unpaidLeaves = await db.leaveRequest.findMany({
      where: {
        staffId,
        leaveType: LeaveType.UNPAID,
        status: LeaveRequestStatus.APPROVED,
        startDate: { lte: endOfMonth },
        endDate: { gte: startOfMonth },
      },
    });

    let totalUnpaidDays = 0;
    const msPerDay = 1000 * 60 * 60 * 24;

    for (const req of unpaidLeaves) {
      const overlapStart = Math.max(req.startDate.getTime(), startOfMonth.getTime());
      const overlapEnd = Math.min(req.endDate.getTime(), endOfMonth.getTime());

      if (overlapEnd >= overlapStart) {
        const days = Math.round((overlapEnd - overlapStart) / msPerDay) + 1;
        totalUnpaidDays += days;
      }
    }

    return totalUnpaidDays;
  }

  /**
   * Lists personal leave requests for a staff member
   */
  static async listPersonalLeaves(staffId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where: { staffId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reviewedBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      db.leaveRequest.count({ where: { staffId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Lists all institutional leave requests with status and departmental filters
   */
  static async listAllLeaves(filters: ListLeavesFilter = {}) {
    const { status, department, staffId, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveRequestWhereInput = {
      status: status ?? undefined,
      staffId: staffId ?? undefined,
      staff: department ? { department } : undefined,
    };

    const [items, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          staff: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          reviewedBy: {
            select: { firstName: true, lastName: true, roleCode: true },
          },
        },
      }),
      db.leaveRequest.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
