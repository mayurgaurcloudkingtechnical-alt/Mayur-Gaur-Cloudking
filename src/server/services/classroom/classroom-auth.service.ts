import crypto from "crypto";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { UserRoleCode, EnrollmentStatus, ClassSessionStatus } from "@prisma/client";

export interface ClassroomJoinTokenPayload {
  userId: string;
  userName: string;
  userRole: string;
  studentId?: string;
  roomCode: string;
  classId: string;
  batchId: string;
  courseId: string;
  isHost: boolean;
  canPublishAudio: boolean;
  canPublishVideo: boolean;
  canShareScreen: boolean;
  issuedAt: number;
  expiresAt: number;
}

export class ClassroomAuthService {
  private static SECRET_KEY =
    process.env.CLASSROOM_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "softlab_global_live_classroom_secure_secret_2026";

  /**
   * Generates a cryptographically signed HMAC-SHA256 token
   */
  public static signToken(payload: ClassroomJoinTokenPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.SECRET_KEY)
      .update(encodedPayload)
      .digest("base64url");
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifies and decodes an HMAC-SHA256 join token
   */
  public static verifyToken(token: string): ClassroomJoinTokenPayload {
    const parts = token.split(".");
    if (parts.length !== 2) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Malformed classroom access token." });
    }

    const [encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", this.SECRET_KEY)
      .update(encodedPayload)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid classroom token signature." });
    }

    const payload: ClassroomJoinTokenPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.expiresAt) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Classroom access token has expired. Please rejoin." });
    }

    return payload;
  }

  /**
   * STRICT 6-POINT SERVER-SIDE ACCESS VALIDATION FOR LIVE CLASSES
   *
   * 1. Authenticated & active user
   * 2. Active enrollment in the course
   * 3. Allocated to the specific batch
   * 4. Scheduled class belongs to that course, module, and batch
   * 5. Valid enrollment status (ACTIVE)
   * 6. Class is currently joinable (or user is assigned trainer / admin)
   */
  public static async authorizeAndGenerateJoinToken(params: {
    userId: string;
    classId: string;
  }): Promise<{ token: string; payload: ClassroomJoinTokenPayload; classDetails: any }> {
    const user = await db.user.findUnique({
      where: { id: params.userId },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              include: { batch: true, course: true },
            },
          },
        },
        trainerProfile: {
          include: {
            assignedBatches: true,
            assignedCourses: true,
          },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Your user account is inactive or not found.",
      });
    }

    // Load scheduled class details with batch, course, module & trainer
    const scheduledClass = await db.scheduledClass.findUnique({
      where: { id: params.classId },
      include: {
        batch: {
          include: {
            course: true,
            trainers: true,
          },
        },
        module: true,
        trainer: {
          include: { user: true },
        },
      },
    });

    if (!scheduledClass) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Live class session not found.",
      });
    }

    const batch = scheduledClass.batch;
    const course = batch.course;
    const isTrainerOrAdmin = (
      [
        UserRoleCode.TRAINER,
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(user.roleCode);

    let isHost = false;
    let canShareScreen = true;

    // --- A. TRAINER / ADMIN AUTHORIZATION ---
    if (isTrainerOrAdmin) {
      if (user.roleCode === UserRoleCode.TRAINER) {
        const trainerProfile = user.trainerProfile;
        if (!trainerProfile) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Trainer profile not registered for this account.",
          });
        }

        const isAssignedToBatch = batch.trainers.some((t) => t.trainerId === trainerProfile.id);
        const isClassTrainer = scheduledClass.trainerId === trainerProfile.id;

        if (!isAssignedToBatch && !isClassTrainer) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Access Denied: You are not assigned to batch ${batch.code} or this lecture session.`,
          });
        }
      }

      isHost = true;
    } else {
      // --- B. STUDENT STRICT 6-POINT ACCESS RULE ---
      const studentProfile = user.studentProfile;
      if (!studentProfile) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Student academic profile not found.",
        });
      }

      // Check active enrollment in this batch & course
      const matchingEnrollment = studentProfile.enrollments.find(
        (e) => e.batchId === batch.id && e.courseId === course.id
      );

      if (!matchingEnrollment) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Access Denied: You are not enrolled in Batch ${batch.code} (${batch.name}) for ${course.title}. Classes are strictly restricted to allocated batch members.`,
        });
      }

      // Check class timing: Can only join 15 minutes before scheduled start up to 1 hour after scheduled duration
      const now = Date.now();
      const startTime = new Date(scheduledClass.scheduledAt).getTime();
      const endTime = startTime + (scheduledClass.durationMin + 60) * 60 * 1000;
      const joinWindowStart = startTime - 15 * 60 * 1000; // 15 mins early

      if (scheduledClass.status === ClassSessionStatus.CANCELLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `This live class session has been cancelled. Reason: ${scheduledClass.statusReason || "Curriculum rescheduling"}`,
        });
      }

      if (now < joinWindowStart) {
        const minsLeft = Math.ceil((joinWindowStart - now) / (60 * 1000));
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Classroom is not open yet. Doors open 15 minutes before lecture start (in ${minsLeft} minutes).`,
        });
      }

      if (now > endTime && scheduledClass.status !== ClassSessionStatus.IN_PROGRESS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This live class session has concluded. You can view the authorized recording in your archive.",
        });
      }

      canShareScreen = false; // Students share screen only when host elevates
    }

    // Ensure class has an assigned room code
    let roomCode = scheduledClass.roomCode;
    if (!roomCode) {
      roomCode = `slg-cls-${scheduledClass.id.slice(-8)}-${crypto.randomBytes(3).toString("hex")}`;
      await db.scheduledClass.update({
        where: { id: scheduledClass.id },
        data: { roomCode },
      });
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + 15 * 60 * 1000; // 15 min validity; renewed via heartbeat

    const payload: ClassroomJoinTokenPayload = {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`.trim(),
      userRole: user.roleCode,
      studentId: user.studentProfile?.studentId,
      roomCode,
      classId: scheduledClass.id,
      batchId: batch.id,
      courseId: course.id,
      isHost,
      canPublishAudio: true,
      canPublishVideo: true,
      canShareScreen,
      issuedAt,
      expiresAt,
    };

    const token = this.signToken(payload);

    return {
      token,
      payload,
      classDetails: {
        id: scheduledClass.id,
        title: scheduledClass.title,
        roomCode,
        batchCode: batch.code,
        batchName: batch.name,
        courseTitle: course.title,
        moduleTitle: scheduledClass.module?.title,
        trainerName: scheduledClass.trainer
          ? `${scheduledClass.trainer.user.firstName} ${scheduledClass.trainer.user.lastName}`
          : "Assigned Faculty",
        scheduledAt: scheduledClass.scheduledAt,
        durationMin: scheduledClass.durationMin,
        isRecordingEnabled: scheduledClass.isRecordingEnabled,
        status: scheduledClass.status,
      },
    };
  }
}
