import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { UserRoleCode, DeliveryMode, ClassSessionStatus, AttendanceStatus } from "@prisma/client";
import { ClassroomAuthService } from "@/server/services/classroom/classroom-auth.service";
import { LiveAttendanceService } from "@/server/services/classroom/live-attendance.service";
import { ClassroomNotificationService } from "@/server/services/classroom/classroom-notification.service";
import { YouTubePublishingService } from "@/server/services/youtube/youtube-publishing.service";
import { db } from "@/server/db/client";

const TRAINER_OR_ADMIN_ROLES = [
  UserRoleCode.TRAINER,
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

export const classroomRouter = router({
  /**
   * 1. Trainer Dashboard: View only assigned batches, modules, and scheduled live lectures
   */
  getTrainerClasses: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES).query(async ({ ctx }) => {
    let trainerProfileId: string | undefined;

    if (ctx.user.roleCode === UserRoleCode.TRAINER) {
      const profile = await ctx.db.trainerProfile.findUnique({
        where: { userId: ctx.user.id },
      });
      if (!profile) return [];
      trainerProfileId = profile.id;
    }

    return ctx.db.scheduledClass.findMany({
      where: trainerProfileId
        ? {
            OR: [
              { trainerId: trainerProfileId },
              {
                batch: {
                  trainers: { some: { trainerId: trainerProfileId } },
                },
              },
            ],
          }
        : {},
      orderBy: { scheduledAt: "asc" },
      include: {
        batch: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            enrollments: {
              where: { status: "ACTIVE" },
              select: { id: true },
            },
          },
        },
        module: { select: { id: true, title: true } },
        trainer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        recordings: { select: { id: true, videoUrl: true, status: true, youTubeUrl: true } },
      },
    });
  }),

  /**
   * 2. Student Dashboard: View live classes strictly for the student's enrolled courses and allocated batch
   */
  getStudentClasses: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          select: { batchId: true, courseId: true },
        },
      },
    });

    if (!student || student.enrollments.length === 0) {
      return [];
    }

    // Extract student's authorized batch IDs
    const authorizedBatchIds = student.enrollments
      .map((e) => e.batchId)
      .filter((id): id is string => Boolean(id));

    if (authorizedBatchIds.length === 0) {
      return [];
    }

    // Return classes belonging ONLY to the student's authorized batches
    return ctx.db.scheduledClass.findMany({
      where: {
        batchId: { in: authorizedBatchIds },
        status: { not: ClassSessionStatus.CANCELLED },
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        batch: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
        },
        module: { select: { id: true, title: true } },
        trainer: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        liveAttendances: {
          where: { studentId: student.id },
          select: {
            status: true,
            totalDurationSeconds: true,
            attendancePercentage: true,
          },
        },
        recordings: {
          select: {
            id: true,
            videoUrl: true,
            status: true,
            durationSeconds: true,
            youTubeUrl: true,
          },
        },
      },
    });
  }),

  /**
   * 3. Trainer Schedules a Live Lecture (Module, Batch, Time, Duration)
   */
  scheduleLiveClass: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES)
    .input(
      z.object({
        batchId: z.string(),
        moduleId: z.string().optional(),
        title: z.string().min(3, "Title must be at least 3 characters"),
        scheduledAt: z.coerce.date(),
        durationMin: z.number().int().min(15).max(480).default(60),
        mode: z.nativeEnum(DeliveryMode).default(DeliveryMode.ONLINE),
        agendaNotes: z.string().optional(),
        allowAutoPublishYouTube: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.batchId },
        include: { trainers: true, course: true },
      });

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found." });
      }

      // Check trainer authorization for this batch
      let trainerProfileId: string | undefined;
      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const profile = await ctx.db.trainerProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!profile) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Trainer profile not found." });
        }
        const isAssigned = batch.trainers.some((t) => t.trainerId === profile.id);
        if (!isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You are not authorized to schedule classes for batch ${batch.code}.`,
          });
        }
        trainerProfileId = profile.id;
      }

      // Generate secure unique room code
      const roomCode = `slg-${batch.code.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

      const newClass = await ctx.db.scheduledClass.create({
        data: {
          batchId: input.batchId,
          moduleId: input.moduleId,
          title: input.title.trim(),
          scheduledAt: input.scheduledAt,
          durationMin: input.durationMin,
          trainerId: trainerProfileId,
          mode: input.mode,
          roomCode,
          agendaNotes: input.agendaNotes?.trim(),
          allowAutoPublishYouTube: input.allowAutoPublishYouTube,
          status: ClassSessionStatus.SCHEDULED,
        },
      });

      // Dispatch targeted notification to enrolled students of this batch
      try {
        await ClassroomNotificationService.dispatchClassNotification({
          classId: newClass.id,
          type: "SCHEDULED",
        });
      } catch (err: any) {
        console.warn("[Classroom] Notification dispatch error:", err.message);
      }

      return newClass;
    }),

  /**
   * 4. Strict 6-Point Access Check & Secure Join Token Generation
   */
  requestJoinToken: protectedProcedure
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ClassroomAuthService.authorizeAndGenerateJoinToken({
        userId: ctx.user.id,
        classId: input.classId,
      });
    }),

  /**
   * 5. Trainer Starts the Live Class
   */
  startClassSession: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES)
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cls = await ctx.db.scheduledClass.findUnique({
        where: { id: input.classId },
        include: { batch: { include: { trainers: true } } },
      });

      if (!cls) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });

      if (ctx.user.roleCode === UserRoleCode.TRAINER) {
        const prof = await ctx.db.trainerProfile.findUnique({ where: { userId: ctx.user.id } });
        if (!cls.batch.trainers.some((t) => t.trainerId === prof?.id) && cls.trainerId !== prof?.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not assigned to this batch." });
        }
      }

      const updated = await ctx.db.scheduledClass.update({
        where: { id: input.classId },
        data: {
          status: ClassSessionStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Dispatch "LIVE NOW" alerts to batch students
      try {
        await ClassroomNotificationService.dispatchClassNotification({
          classId: input.classId,
          type: "STARTED",
        });
      } catch {}

      return updated;
    }),

  /**
   * 6. Trainer Ends the Live Class (Triggers Attendance Finalization & Auto-Recording)
   */
  endClassSession: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES)
    .input(z.object({ classId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cls = await ctx.db.scheduledClass.findUnique({
        where: { id: input.classId },
        include: { batch: { include: { trainers: true, course: true } } },
      });

      if (!cls) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });

      const endedAt = new Date();
      const updated = await ctx.db.scheduledClass.update({
        where: { id: input.classId },
        data: {
          status: ClassSessionStatus.COMPLETED,
          endedAt,
        },
      });

      // Finalize student attendance and mirror to LMS attendance records
      await LiveAttendanceService.finalizeClassAttendance(input.classId, ctx.user.id);

      // Create recording record
      const storageKey = `recordings/${cls.batch.course.id}/${cls.batch.id}/${cls.id}.mp4`;
      const videoUrl = `/api/classroom/recordings/${cls.id}`;

      const recording = await ctx.db.classRecording.create({
        data: {
          classId: cls.id,
          storageKey,
          storageProvider: "LOCAL_SECURE",
          durationSeconds: cls.durationMin * 60,
          videoUrl,
          status: "READY",
        },
      });

      // If class is marked for auto-publishing to YouTube, enqueue automatically
      if (cls.allowAutoPublishYouTube) {
        try {
          await YouTubePublishingService.enqueueRecordingForPublishing(recording.id);
        } catch (ytErr: any) {
          console.warn("[Classroom] YouTube publish enqueue failed:", ytErr.message);
        }
      }

      return { success: true, updated, recordingId: recording.id };
    }),

  /**
   * 7. Participant Session Heartbeat (Every 30 seconds from active browser)
   */
  sendHeartbeat: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        deltaSeconds: z.number().min(1).max(60).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await LiveAttendanceService.recordHeartbeat({
        classId: input.classId,
        userId: ctx.user.id,
        deltaSeconds: input.deltaSeconds,
      });
      return { ok: true };
    }),

  /**
   * 8. Participant Action Events (Joined, Left, Hand Raised)
   */
  logSessionEvent: protectedProcedure
    .input(
      z.object({
        classId: z.string(),
        eventType: z.enum([
          "JOINED",
          "LEFT",
          "RECONNECTED",
          "HAND_RAISED",
          "MIC_TOGGLED",
          "CAM_TOGGLED",
          "CHAT_SENT",
        ]),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await LiveAttendanceService.recordParticipantEvent({
        classId: input.classId,
        userId: ctx.user.id,
        userRole: ctx.user.roleCode,
        eventType: input.eventType,
        metadata: input.metadata,
      });
      return { ok: true };
    }),

  /**
   * 9. View Batch Attendance Roster for a Class
   */
  getClassAttendanceRoster: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES)
    .input(z.object({ classId: z.string() }))
    .query(async ({ ctx, input }) => {
      const scheduledClass = await ctx.db.scheduledClass.findUnique({
        where: { id: input.classId },
        include: {
          batch: {
            include: {
              enrollments: {
                where: { status: "ACTIVE" },
                include: {
                  student: {
                    include: {
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                          email: true,
                          phone: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!scheduledClass) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });

      const liveAttendances = await ctx.db.liveClassAttendance.findMany({
        where: { classId: input.classId },
      });

      const attendanceMap = new Map(liveAttendances.map((a) => [a.studentId, a]));

      return scheduledClass.batch.enrollments.map((e) => {
        const live = attendanceMap.get(e.studentId);
        return {
          enrollmentId: e.id,
          studentId: e.studentId,
          studentCode: e.student.studentId,
          studentName: `${e.student.user.firstName} ${e.student.user.lastName}`,
          email: e.student.user.email,
          phone: e.student.user.phone,
          status: live?.status || AttendanceStatus.ABSENT,
          totalDurationSeconds: live?.totalDurationSeconds || 0,
          attendancePercentage: live?.attendancePercentage || 0,
          firstJoinedAt: live?.firstJoinedAt,
          lastLeftAt: live?.lastLeftAt,
          joinCount: live?.joinCount || 0,
          isManuallyCorrected: live?.isManuallyCorrected || false,
          correctionReason: live?.correctionReason,
        };
      });
    }),

  /**
   * 10. Manual Attendance Correction
   */
  correctAttendance: requireRoleProcedure(TRAINER_OR_ADMIN_ROLES)
    .input(
      z.object({
        attendanceId: z.string(),
        newStatus: z.nativeEnum(AttendanceStatus),
        reason: z.string().min(3, "Reason required for audit trail"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return LiveAttendanceService.correctAttendance({
        attendanceId: input.attendanceId,
        newStatus: input.newStatus,
        reason: input.reason,
        actorUserId: ctx.user.id,
      });
    }),
});
