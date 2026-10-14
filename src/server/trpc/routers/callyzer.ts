import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode } from "@prisma/client";
import { StaffCallyzerService } from "@/server/services/staff-callyzer.service";
import { db } from "@/server/db/client";

const managerialRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
];

export const callyzerRouter = router({
  /**
   * Callyzer Live Team Monitoring Dashboard
   * Live presence, real-time calling state, duration timers, post-wise statistics
   */
  getLiveTeamMonitoring: requireRoleProcedure(managerialRoles)
    .input(
      z
        .object({
          roleCode: z.string().optional(),
          search: z.string().optional(),
          managerId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return StaffCallyzerService.getLiveTeamMonitoring(
        ctx.user,
        input?.roleCode,
        input?.search,
        input?.managerId
      );
    }),

  /**
   * List Reporting Managers / Supervisors for hierarchy filtering
   */
  listReportingManagers: requireRoleProcedure(managerialRoles).query(async () => {
    return StaffCallyzerService.getReportingManagersList();
  }),

  /**
   * Staff Personal Workstation State
   * Called by Telecaller, Counselor, Marketing desks for real-time timer and progress
   */
  getMyWorkstationState: protectedProcedure.query(async ({ ctx }) => {
    return StaffCallyzerService.getMyWorkstationState(ctx.user.id);
  }),

  /**
   * Update personal live status (Available, On Call, Break, Offline)
   */
  updateLiveStatus: protectedProcedure
    .input(
      z.object({
        status: z.enum(["AVAILABLE", "ON_CALL", "ON_BREAK", "WRAP_UP", "OFFLINE"]),
        currentCallContact: z.string().optional(),
        currentCallPhone: z.string().optional(),
        breakReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffCallyzerService.updateLiveStatus(ctx.user.id, input);
    }),

  /**
   * Log an outgoing or incoming call with complete disposition, talk-time, and follow-up
   */
  logCallActivity: protectedProcedure
    .input(
      z.object({
        contactName: z.string().min(1, "Contact name is required"),
        contactPhone: z.string().min(6, "Valid phone number required"),
        callType: z.enum(["OUTGOING", "INCOMING", "MISSED", "REJECTED"]).optional(),
        callStatus: z.enum(["CONNECTED", "BUSY", "NO_ANSWER", "FAILED"]).optional(),
        disposition: z.string().min(1, "Call disposition is required"),
        durationSeconds: z.number().int().min(0),
        notes: z.string().optional(),
        nextFollowUpDate: z.date().optional(),
        leadId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffCallyzerService.logCallActivity(ctx.user.id, input);
    }),

  /**
   * List Call Logs with multi-filter (date, role/post, disposition, search)
   */
  listCallLogs: requireRoleProcedure(managerialRoles)
    .input(
      z.object({
        userId: z.string().optional(),
        managerId: z.string().optional(),
        roleCode: z.string().optional(),
        disposition: z.string().optional(),
        date: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().min(1).optional(),
        pageSize: z.number().int().min(1).max(100).optional(),
      })
    )
    .query(async ({ input }) => {
      return StaffCallyzerService.listCallLogs(input);
    }),

  /**
   * Edit Call Log (Notes, Disposition, Follow-up date)
   */
  updateCallLog: requireRoleProcedure(managerialRoles)
    .input(
      z.object({
        callLogId: z.string(),
        disposition: z.string().optional(),
        notes: z.string().optional(),
        nextFollowUpDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffCallyzerService.updateCallLog(input);
    }),

  /**
   * Update Staff Member's Daily Calling Target
   */
  updateDailyTarget: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ])
    .input(
      z.object({
        userId: z.string(),
        targetCalls: z.number().int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return db.staffLiveSession.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          dailyTargetCalls: input.targetCalls,
          status: "AVAILABLE",
        },
        update: {
          dailyTargetCalls: input.targetCalls,
        },
      });
    }),
});
