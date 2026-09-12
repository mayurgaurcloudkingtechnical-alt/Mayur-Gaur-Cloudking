import {
  PrismaClient,
  UserRoleCode,
  BatchStatus,
  EnrollmentStatus,
  AttendanceStatus,
  ClassSessionStatus,
} from "@prisma/client";
import { TrainerService } from "../src/server/services/trainer.service";
import { AttendanceService } from "../src/server/services/attendance.service";

const prisma = new PrismaClient();

async function runDay6Verification() {
  console.log("=== SOFTLAB GLOBAL: Day 6 Trainer Portal & Attendance Verification ===\n");
  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      allPassed = false;
    }
  }

  // 1. Resolve Seeded Faculty & Data
  console.log("--> 1. Resolving Seeded Faculty and Cohort Data...");
  const primaryTrainerUser = await prisma.user.findFirst({
    where: { email: "trainer@softlabglobal.com" },
    include: { trainerProfile: true },
  });
  assert(!!primaryTrainerUser?.trainerProfile, "Primary trainer account and profile exist");

  const secondaryTrainerUser = await prisma.user.findFirst({
    where: { email: "faculty2@softlabglobal.com" },
    include: { trainerProfile: true },
  });
  assert(!!secondaryTrainerUser?.trainerProfile, "Secondary trainer account and profile exist");

  const batch = await prisma.batch.findUnique({
    where: { code: "FSWD-2026-B1" },
    include: {
      trainers: true,
      classes: { orderBy: { scheduledAt: "asc" } },
      enrollments: { include: { student: { include: { user: true } } } },
    },
  });
  assert(!!batch, "Cohort batch FSWD-2026-B1 exists");

  if (!primaryTrainerUser || !secondaryTrainerUser || !batch) {
    console.error("Missing prerequisite seed data. Aborting.");
    process.exit(1);
  }

  const primaryCtx = {
    user: { id: primaryTrainerUser.id, roleCode: UserRoleCode.TRAINER },
    db: prisma,
  };

  const secondaryCtx = {
    user: { id: secondaryTrainerUser.id, roleCode: UserRoleCode.TRAINER },
    db: prisma,
  };

  // 2. Trainer Batch Scoping & Cross-Trainer Isolation
  console.log("\n--> 2. Testing Trainer Batch Scoping & Cross-Trainer Isolation...");
  const primaryBatches = await TrainerService.getAssignedBatches(primaryCtx);
  assert(
    primaryBatches.some((b: any) => b.code === "FSWD-2026-B1"),
    "Primary trainer sees assigned batch FSWD-2026-B1"
  );

  const secondaryBatches = await TrainerService.getAssignedBatches(secondaryCtx);
  assert(
    !secondaryBatches.some((b: any) => b.code === "FSWD-2026-B1"),
    "Secondary trainer does NOT see unassigned batch FSWD-2026-B1"
  );

  // Cross-trainer workspace access must be rejected with FORBIDDEN
  let crossAccessForbidden = false;
  try {
    await TrainerService.getBatchWorkspace(secondaryCtx, batch.id);
  } catch (err: any) {
    crossAccessForbidden = true;
    assert(err.code === "FORBIDDEN", "Cross-trainer access to batch workspace threw FORBIDDEN");
  }
  if (!crossAccessForbidden) {
    assert(false, "Cross-trainer access should have thrown FORBIDDEN");
  }

  // 3. Server-Side Attendance Roster Derivation
  console.log("\n--> 3. Verifying Server-Side Attendance Roster Derivation...");
  const targetSession = batch.classes[0];
  assert(!!targetSession, "Class session found in batch");

  if (targetSession) {
    // Create temporary suspended enrollment to ensure exclusion
    const dummyUser = await prisma.user.upsert({
      where: { email: "dummy.suspended@softlabglobal.com" },
      update: {},
      create: {
        email: "dummy.suspended@softlabglobal.com",
        firstName: "Suspended",
        lastName: "Student",
        passwordHash: "$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhash",
        roleCode: UserRoleCode.STUDENT,
      },
    });

    const dummyProfile = await prisma.studentProfile.upsert({
      where: { userId: dummyUser.id },
      update: {},
      create: {
        userId: dummyUser.id,
        studentId: "SLG-SUSPENDED-01",
      },
    });

    const suspendedEnrollment = await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: dummyProfile.id, courseId: batch.courseId } },
      update: { status: EnrollmentStatus.SUSPENDED, batchId: batch.id },
      create: {
        studentId: dummyProfile.id,
        courseId: batch.courseId,
        batchId: batch.id,
        status: EnrollmentStatus.SUSPENDED,
      },
    });

    const rosterResult = await AttendanceService.getSessionAttendanceRoster(primaryCtx, targetSession.id);
    const hasSuspended = rosterResult.roster.some((r: any) => r.studentId === "SLG-SUSPENDED-01");
    assert(!hasSuspended, "Suspended student is strictly excluded from active attendance roster");

    const activeStudentPresent = rosterResult.roster.some((r: any) => r.studentId === "SLG-2026-0001");
    assert(activeStudentPresent, "Active enrolled student is present in server-derived roster");

    // Cleanup dummy enrollment
    await prisma.enrollment.delete({ where: { id: suspendedEnrollment.id } });
    await prisma.studentProfile.delete({ where: { id: dummyProfile.id } });
    await prisma.user.delete({ where: { id: dummyUser.id } });
  }

  // 4. Unique Database Constraint Enforcement
  console.log("\n--> 4. Testing Attendance Unique Constraint [recordId, studentId]...");
  if (targetSession) {
    const activeStudent = batch.enrollments.find((e) => e.status === EnrollmentStatus.ACTIVE);
    if (activeStudent) {
      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: { sessionId: targetSession.id },
      });

      if (existingRecord) {
        let duplicateBlocked = false;
        try {
          await prisma.attendanceEntry.create({
            data: {
              recordId: existingRecord.id,
              studentId: activeStudent.studentId,
              status: AttendanceStatus.PRESENT,
            },
          });
        } catch (err: any) {
          duplicateBlocked = true;
          assert(
            err.code === "P2002" || err.message.includes("Unique constraint"),
            "Database unique constraint P2002 blocked duplicate entry for [recordId, studentId]"
          );
        }
        if (!duplicateBlocked) {
          assert(false, "Duplicate attendance entry creation should have been blocked");
        }
      }
    }
  }

  // 5. Atomic Bulk Attendance Save Workflow
  console.log("\n--> 5. Testing Atomic Bulk Attendance Save in Prisma Transaction...");
  const secondSession = batch.classes[1] || batch.classes[0];
  if (secondSession) {
    const activeStudent = batch.enrollments.find((e) => e.status === EnrollmentStatus.ACTIVE);
    if (activeStudent) {
      const saveResult = await AttendanceService.saveSessionAttendance(primaryCtx, {
        sessionId: secondSession.id,
        topicCovered: "Prisma Transactions & Relational Modeling",
        entries: [
          {
            studentId: activeStudent.studentId,
            status: AttendanceStatus.PRESENT,
            remark: "Engaged in hands-on lab",
          },
        ],
      });

      assert(saveResult.success, "Attendance successfully saved in transaction");
      assert(saveResult.summary.present === 1, "Summary correctly computed 1 Present");

      // Verify ScheduledClass status updated to COMPLETED
      const updatedClass = await prisma.scheduledClass.findUnique({
        where: { id: secondSession.id },
      });
      assert(updatedClass?.status === ClassSessionStatus.COMPLETED, "Class session automatically transitioned to COMPLETED");
      assert(
        updatedClass?.topicCovered === "Prisma Transactions & Relational Modeling",
        "Session topicCovered field updated"
      );
    }
  }

  // 6. Cross-Trainer Attendance Modification Rejection
  console.log("\n--> 6. Verifying Cross-Trainer Attendance Modification Rejection...");
  if (secondSession) {
    let crossSaveForbidden = false;
    try {
      await AttendanceService.saveSessionAttendance(secondaryCtx, {
        sessionId: secondSession.id,
        topicCovered: "Unauthorized Tampering Attempt",
        entries: [],
      });
    } catch (err: any) {
      crossSaveForbidden = true;
      assert(err.code === "FORBIDDEN", "Unauthorized trainer attendance save rejected with FORBIDDEN");
    }
    if (!crossSaveForbidden) {
      assert(false, "Unauthorized trainer attendance save should have failed with FORBIDDEN");
    }
  }

  // 7. Batch Attendance Summary Calculation
  console.log("\n--> 7. Verifying Batch Attendance Statistics Calculation...");
  const batchStats = await AttendanceService.getBatchAttendanceStats(primaryCtx, batch.id);
  assert(batchStats.sessionsCount >= 1, `Batch has recorded sessions (${batchStats.sessionsCount})`);
  assert(batchStats.overallPercentage >= 0 && batchStats.overallPercentage <= 100, `Overall attendance rate valid: ${batchStats.overallPercentage}%`);

  // 8. Audit Logging Verification
  console.log("\n--> 8. Verifying Audit Log Records Created for Attendance & Session Changes...");
  const recentAudit = await prisma.auditLog.findFirst({
    where: {
      action: { in: ["ATTENDANCE_SUBMITTED", "ATTENDANCE_CORRECTED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  assert(!!recentAudit, "AuditLog record verified for attendance operations");

  console.log("\n==================================================");
  if (allPassed) {
    console.log("SUCCESS: All Day 6 Trainer Portal & Attendance verifications passed!");
  } else {
    console.error("FAILURE: Some Day 6 verifications failed.");
    process.exitCode = 1;
  }
}

runDay6Verification()
  .catch((e) => {
    console.error("Verification script failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
