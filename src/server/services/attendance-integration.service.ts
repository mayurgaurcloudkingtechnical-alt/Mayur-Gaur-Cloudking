import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";

export interface LoginCheckInParams {
  userId: string;
  clientIp?: string;
  userAgent?: string;
}

export interface RegularizationInput {
  staffId: string;
  date: Date;
  type: "MISSED_CHECK_IN" | "MISSED_CHECK_OUT" | "REMOTE_WORK" | "FIELD_VISIT" | "FORGOTTEN_PUNCH";
  requestedCheckIn?: Date;
  requestedCheckOut?: Date;
  reason: string;
}

export interface OvertimeInput {
  staffId: string;
  date: Date;
  hours: number;
  reason: string;
}

export class AttendanceIntegrationService {
  /**
   * Automatically invoked whenever any user successfully authenticates.
   * Strictly filters out STUDENT logins and only proceeds if user has an active StaffProfile.
   * Completely idempotent: repeated logins, refreshes, or multi-tabs on the same date will NEVER duplicate check-ins.
   */
  static async recordLoginCheckIn({ userId, clientIp, userAgent }: LoginCheckInParams) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          staffProfile: {
            include: { shift: true },
          },
        },
      });

      // 1. Guard: Only active staff members record staff attendance (never students or inactive users)
      if (!user || user.roleCode === UserRoleCode.STUDENT || !user.staffProfile || !user.staffProfile.isActive) {
        return null;
      }

      const staff = user.staffProfile;
      const now = new Date();

      // Normalize date to YYYY-MM-DD for organizational calendar
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const startOfDay = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 0, 0, 0, 0));

      const idempotencyKey = `crm_login_checkin_${staff.id}_${dateStr}`;

      // 2. Check if an event was already processed today
      const existingEvent = await db.attendanceEvent.findUnique({
        where: { idempotencyKey },
      });

      if (existingEvent) {
        // Return existing event silently — zero duplicate check-in
        return {
          status: "ALREADY_CHECKED_IN",
          event: existingEvent,
        };
      }

      // 3. Evaluate Shift & Late Arrival Thresholds
      let attendanceStatus = "PRESENT";
      if (staff.shift && staff.shift.startTime) {
        // e.g. "09:30"
        const [shiftHour, shiftMin] = staff.shift.startTime.split(":").map(Number);
        const shiftStartToday = new Date(now);
        shiftStartToday.setHours(shiftHour, shiftMin, 0, 0);

        // Add 15 minute grace period
        const graceEnd = new Date(shiftStartToday.getTime() + 15 * 60 * 1000);
        if (now > graceEnd) {
          attendanceStatus = "LATE";
        }
      } else {
        // Default standard office timing: 10:15 AM late threshold
        const standardGrace = new Date(now);
        standardGrace.setHours(10, 15, 0, 0);
        if (now > standardGrace) {
          attendanceStatus = "LATE";
        }
      }

      // 4. Atomic upsert to StaffAttendance + AttendanceEvent record
      const attendance = await db.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: startOfDay,
          },
        },
        create: {
          staffId: staff.id,
          date: startOfDay,
          status: attendanceStatus,
          checkInTime: now,
          remarks: "Automatic CRM/LMS login attendance event recorded",
        },
        update: {
          // If already marked, preserve original earlier check-in time!
        },
      });

      const event = await db.attendanceEvent.create({
        data: {
          userId: user.id,
          staffId: staff.id,
          eventType: "LOGIN_CHECKIN",
          source: "CRM_LMS_LOGIN",
          ipAddress: clientIp,
          userAgent: userAgent,
          idempotencyKey,
          timestamp: now,
          status: "PROCESSED",
          metadata: {
            roleCode: user.roleCode,
            status: attendanceStatus,
            attendanceId: attendance.id,
          },
        },
      });

      return {
        status: "CHECKED_IN",
        attendance,
        event,
      };
    } catch (err: any) {
      // Non-blocking error handling: log error but do not break user login flow
      console.error("[AttendanceIntegrationService.recordLoginCheckIn] Error:", err?.message || err);
      return null;
    }
  }

  /**
   * Invoked on verified logout or session expiration
   */
  static async recordLogoutCheckOut({ userId, clientIp, userAgent }: LoginCheckInParams) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { staffProfile: true },
      });

      if (!user || !user.staffProfile) return null;
      const staff = user.staffProfile;
      const now = new Date();

      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const startOfDay = new Date(Date.UTC(year, now.getMonth(), now.getDate(), 0, 0, 0, 0));

      const existingAttendance = await db.staffAttendance.findUnique({
        where: {
          staffId_date: {
            staffId: staff.id,
            date: startOfDay,
          },
        },
      });

      if (!existingAttendance) return null;

      const checkIn = existingAttendance.checkInTime || now;
      const diffMs = Math.max(0, now.getTime() - checkIn.getTime());
      const hours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

      await db.staffAttendance.update({
        where: { id: existingAttendance.id },
        data: {
          checkOutTime: now,
          workingHours: hours,
        },
      });

      const event = await db.attendanceEvent.create({
        data: {
          userId: user.id,
          staffId: staff.id,
          eventType: "LOGOUT_CHECKOUT",
          source: "CRM_LMS_LOGOUT",
          ipAddress: clientIp,
          userAgent: userAgent,
          timestamp: now,
          status: "PROCESSED",
          metadata: { workingHours: hours },
        },
      });

      return event;
    } catch (err: any) {
      console.error("[AttendanceIntegrationService.recordLogoutCheckOut] Error:", err?.message || err);
      return null;
    }
  }

  /**
   * Staff requests manual attendance correction/regularization
   */
  static async submitRegularizationRequest(actor: AuthenticatedUser, input: RegularizationInput) {
    // Verify actor can request for this staffId
    const staff = await db.staffProfile.findUnique({
      where: { id: input.staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
    }

    const isSelf = staff.userId === actor.id;
    const isHrOrAdmin = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isSelf && !isHrOrAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only submit regularization requests for your own attendance.",
      });
    }

    const normalizedDate = new Date(input.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const req = await db.attendanceRegularizationRequest.create({
      data: {
        staffId: input.staffId,
        date: normalizedDate,
        type: input.type,
        requestedCheckIn: input.requestedCheckIn,
        requestedCheckOut: input.requestedCheckOut,
        reason: input.reason.trim(),
        status: "PENDING",
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return req;
  }

  /**
   * Manager / HR / Director reviews and acts upon regularization request
   */
  static async reviewRegularizationRequest(
    actor: AuthenticatedUser,
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to approve attendance regularization requests.",
      });
    }

    const req = await db.attendanceRegularizationRequest.findUnique({
      where: { id: requestId },
      include: { staff: true },
    });

    if (!req) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Request not found." });
    }

    const updated = await db.attendanceRegularizationRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        rejectionReason: decision === "REJECTED" ? rejectionReason?.trim() : null,
      },
    });

    // If approved, update or create StaffAttendance
    if (decision === "APPROVED") {
      const checkIn = req.requestedCheckIn || new Date(req.date);
      const checkOut = req.requestedCheckOut;
      let workingHours: number | undefined = undefined;
      if (checkIn && checkOut) {
        workingHours = Number(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
      }

      await db.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: req.staffId,
            date: req.date,
          },
        },
        create: {
          staffId: req.staffId,
          date: req.date,
          status: "PRESENT",
          checkInTime: checkIn,
          checkOutTime: checkOut,
          workingHours,
          remarks: `Regularized by ${actor.firstName} ${actor.lastName} (${req.type}): ${req.reason}`,
          verifiedById: actor.id,
        },
        update: {
          status: "PRESENT",
          ...(checkIn && { checkInTime: checkIn }),
          ...(checkOut && { checkOutTime: checkOut }),
          ...(workingHours !== undefined && { workingHours }),
          remarks: `Regularized by ${actor.firstName} ${actor.lastName} (${req.type}): ${req.reason}`,
          verifiedById: actor.id,
        },
      });

      await AuditService.log({
        actorId: actor.id,
        action: "ATTENDANCE_REGULARIZATION_APPROVED",
        resourceType: "AttendanceRegularizationRequest",
        resourceId: req.id,
        newData: { staffId: req.staffId, date: req.date, type: req.type },
      });
    }

    return updated;
  }

  /**
   * Submit and review overtime requests
   */
  static async submitOvertimeRequest(actor: AuthenticatedUser, input: OvertimeInput) {
    const staff = await db.staffProfile.findUnique({
      where: { id: input.staffId },
    });
    if (!staff) throw new TRPCError({ code: "NOT_FOUND", message: "Staff not found" });

    const isSelf = staff.userId === actor.id;
    const isHrOrAdmin = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isSelf && !isHrOrAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    return db.overtimeRequest.create({
      data: {
        staffId: input.staffId,
        date: input.date,
        hours: input.hours,
        reason: input.reason.trim(),
        status: "PENDING",
      },
      include: { staff: { include: { user: true } } },
    });
  }

  static async reviewOvertimeRequest(
    actor: AuthenticatedUser,
    requestId: string,
    decision: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.HR,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });

    return db.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: decision,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        rejectionReason: decision === "REJECTED" ? rejectionReason?.trim() : null,
      },
    });
  }

  /**
   * List regularization and overtime requests
   */
  static async listRegularizations(params?: { staffId?: string; status?: string }) {
    return db.attendanceRegularizationRequest.findMany({
      where: {
        ...(params?.staffId ? { staffId: params.staffId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        reviewer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listOvertimes(params?: { staffId?: string; status?: string }) {
    return db.overtimeRequest.findMany({
      where: {
        ...(params?.staffId ? { staffId: params.staffId } : {}),
        ...(params?.status ? { status: params.status } : {}),
      },
      include: {
        staff: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        reviewer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Leave Balances Engine
   */
  static async getOrCreateLeaveBalances(staffId: string, year: number = new Date().getFullYear()) {
    const defaultTypes = ["CASUAL", "SICK", "EARNED"] as const;

    const existing = await db.leaveBalance.findMany({
      where: { staffId, year },
    });

    if (existing.length === 0) {
      const defaultAllocations: Record<string, number> = {
        CASUAL: 12,
        SICK: 10,
        EARNED: 15,
      };

      const created = await Promise.all(
        defaultTypes.map((type) =>
          db.leaveBalance.create({
            data: {
              staffId,
              year,
              leaveType: type as any,
              allocated: defaultAllocations[type] || 10,
              used: 0,
              pending: 0,
              balance: defaultAllocations[type] || 10,
            },
          })
        )
      );
      return created;
    }

    return existing;
  }
}
