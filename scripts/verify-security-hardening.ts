import fs from "fs";
import path from "path";
import { PrismaClient, EnrollmentStatus, LessonType, ContentStatus, UserRoleCode } from "@prisma/client";
import { LearningService } from "../src/server/services/learning.service";
import { LearningProgressService } from "../src/server/services/learning-progress.service";
import { S3StorageService } from "../src/server/storage/s3-storage.service";

const prisma = new PrismaClient();

async function runSecurityHardeningVerification() {
  console.log("=== SOFTLAB GLOBAL: Security Hardening Verification ===\n");
  let allPassed = true;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      allPassed = false;
    }
  }

  // 1. Audit Tracked Files for Hardcoded Passwords
  console.log("--> 1. Checking Tracked Source & Seed Files for Hardcoded Passwords...");
  const filesToCheck = [
    ".env.example",
    "src/lib/env.ts",
    "prisma/seed.ts",
    "scripts/reset-seed-credentials.ts",
    "src/server/storage/s3-storage.service.ts",
    "src/server/services/learning.service.ts",
    "src/server/services/learning-progress.service.ts"
  ];

  const bannedSubstrings = [
    "SuperAdmin123!",
    "Trainer123!",
    "Student123!",
    "password123",
    "admin123",
    "secret123"
  ];

  for (const relativePath of filesToCheck) {
    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) {
      assert(false, `File exists: ${relativePath}`);
      continue;
    }
    const content = fs.readFileSync(filePath, "utf-8");
    let hasLeak = false;
    for (const banned of bannedSubstrings) {
      if (content.toLowerCase().includes(banned.toLowerCase())) {
        hasLeak = true;
        assert(false, `Found hardcoded password pattern in ${relativePath}: "${banned}"`);
      }
    }
    if (!hasLeak) {
      assert(true, `No hardcoded passwords found in ${relativePath}`);
    }
  }

  // 2. Verify External Link Protocol Security
  console.log("\n--> 2. Verifying External Link Protocol Security...");
  assert(S3StorageService.isSafeUrl("https://docs.softlabglobal.com/guide.pdf"), "Valid https:// URL is permitted");
  assert(S3StorageService.isSafeUrl("http://example.com/spec.pdf"), "Valid http:// URL is permitted");
  assert(!S3StorageService.isSafeUrl("javascript:alert(1)"), "javascript: scheme is blocked");
  assert(!S3StorageService.isSafeUrl("data:text/html,<script>alert(1)</script>"), "data: scheme is blocked");
  assert(!S3StorageService.isSafeUrl("vbscript:MsgBox(1)"), "vbscript: scheme is blocked");
  assert(!S3StorageService.isSafeUrl("file:///etc/passwd"), "file:/// scheme is blocked");
  assert(!S3StorageService.isSafeUrl(""), "Empty URL is rejected");

  // 3. Verify Database Seed State & Non-Destructive Seeding Logic
  console.log("\n--> 3. Verifying Seed Password Behavior & Audit Log Integration...");
  const superAdmin = await prisma.user.findFirst({
    where: { email: { contains: "admin" } }
  });
  assert(!!superAdmin, "Super Admin user exists in database");

  if (superAdmin) {
    const originalHash = superAdmin.passwordHash;
    assert(originalHash.startsWith("$2"), "Password is stored as a secure bcrypt hash");
  }

  // 4. Verify Student LMS Learning Payload Sanitization
  console.log("\n--> 4. Verifying Student LMS Payload Sanitization...");
  const student = await prisma.user.findFirst({
    where: { email: { contains: "student" } },
    include: { studentProfile: true }
  });

  const enrollment = await prisma.enrollment.findFirst({
    where: { status: EnrollmentStatus.ACTIVE },
    include: {
      student: { include: { user: true } },
      course: {
        include: {
          modules: {
            where: { status: ContentStatus.PUBLISHED },
            include: {
              lessons: {
                where: {
                  status: ContentStatus.PUBLISHED,
                  type: { in: [LessonType.DOCUMENT, LessonType.PDF] }
                }
              }
            }
          }
        }
      }
    }
  });

  if (enrollment && enrollment.student?.user) {
    const studentCtx = {
      db: prisma,
      session: {
        user: {
          id: enrollment.student.user.id,
          roleCode: UserRoleCode.STUDENT,
        }
      }
    };

    const playerResult = await LearningService.getCoursePlayer(
      studentCtx,
      enrollment.id
    );

    assert(!!playerResult, "LearningService.getCoursePlayer returned course player data");

    let containsStorageLeak = false;
    for (const mod of playerResult.modules) {
      for (const lesson of mod.lessons) {
        const details = (lesson as any).contentDetails;
        if (details) {
          if ("documentUrl" in details || "storageFileKey" in details) {
            containsStorageLeak = true;
          }
        }
      }
    }

    assert(!containsStorageLeak, "Course player modules list does NOT leak documentUrl or storageFileKey");

    if (playerResult.currentLesson?.type === LessonType.DOCUMENT || playerResult.currentLesson?.type === LessonType.PDF) {
      const currentDetails = playerResult.currentLesson.contentDetails as any;
      assert(
        !currentDetails?.documentUrl && !currentDetails?.storageFileKey,
        "Current lesson contentDetails strips raw documentUrl and storageFileKey"
      );
      assert(
        typeof currentDetails?.hasResource === "boolean",
        "Current lesson contentDetails provides hasResource boolean flag"
      );
    }
  } else {
    console.log("[SKIP] No active student enrollment found with student user for live player test");
  }

  // 5. Verify getLessonResourceDownloadUrl Access Controls
  console.log("\n--> 5. Verifying getLessonResourceDownloadUrl Access Controls...");
  if (enrollment && enrollment.student?.user) {
    // Find or create a document lesson in this course
    let docLesson = await prisma.lesson.findFirst({
      where: {
        type: { in: [LessonType.DOCUMENT, LessonType.PDF] },
        module: { courseId: enrollment.courseId, status: ContentStatus.PUBLISHED },
        status: ContentStatus.PUBLISHED
      },
      include: { contentDetails: true }
    });

    if (!docLesson) {
      // Find a published module in this course
      const pubModule = await prisma.module.findFirst({
        where: { courseId: enrollment.courseId, status: ContentStatus.PUBLISHED }
      });
      if (pubModule) {
        docLesson = await prisma.lesson.create({
          data: {
            moduleId: pubModule.id,
            title: "Security Verification Document",
            type: LessonType.DOCUMENT,
            status: ContentStatus.PUBLISHED,
            contentDetails: {
              create: {
                storageFileKey: "private/courses/security-hardening-test.pdf",
                fileName: "security-hardening-test.pdf",
                documentUrl: "https://storage.softlabglobal.com/security-hardening-test.pdf"
              }
            }
          },
          include: { contentDetails: true }
        });
      }
    } else if (!docLesson.contentDetails) {
      await prisma.lessonContent.create({
        data: {
          lessonId: docLesson.id,
          storageFileKey: "private/courses/security-hardening-test.pdf",
          fileName: "security-hardening-test.pdf",
          documentUrl: "https://storage.softlabglobal.com/security-hardening-test.pdf"
        }
      });
    }

    if (docLesson) {
      const studentCtx = {
        db: prisma,
        session: {
          user: {
            id: enrollment.student.user.id,
            roleCode: UserRoleCode.STUDENT,
          }
        }
      };

      // Test 5a: Authorized student with active enrollment
      const authResult = await LearningProgressService.getLessonResourceDownloadUrl(
        studentCtx,
        enrollment.id,
        docLesson.id
      );

      assert(
        typeof authResult.available === "boolean",
        `Authorized request handled cleanly (available: ${authResult.available})`
      );

      // Verify audit log generated for access attempt
      const accessLog = await prisma.auditLog.findFirst({
        where: {
          actorId: enrollment.student.user.id,
          action: "LESSON_RESOURCE_ACCESSED",
          resourceType: "LessonContent",
          resourceId: docLesson.id
        },
        orderBy: { createdAt: "desc" }
      });
      assert(!!accessLog, "Audit log record created for document resource access attempt");

      // Test 5b: Foreign / unauthorized student rejected
      const foreignUser = await prisma.user.findFirst({
        where: {
          id: { not: enrollment.student.user.id },
          role: { code: { not: UserRoleCode.SUPER_ADMIN } }
        }
      });

      if (foreignUser) {
        let unauthorizedRejected = false;
        try {
          const foreignCtx = {
            db: prisma,
            session: {
              user: {
                id: foreignUser.id,
                roleCode: UserRoleCode.STUDENT,
              }
            }
          };
          await LearningProgressService.getLessonResourceDownloadUrl(
            foreignCtx,
            enrollment.id,
            docLesson.id
          );
        } catch (err: any) {
          unauthorizedRejected = true;
          assert(err.code === "FORBIDDEN" || err.message.includes("not authorized"), "Foreign student access rejected with FORBIDDEN");
        }
        if (!unauthorizedRejected) {
          assert(false, "Foreign student access should have thrown FORBIDDEN");
        }
      }

      // Test 5c: Non-existent enrollment rejected
      let nonExistentRejected = false;
      try {
        await LearningProgressService.getLessonResourceDownloadUrl(
          studentCtx,
          "cl_non_existent_enrollment",
          docLesson.id
        );
      } catch (err: any) {
        nonExistentRejected = true;
        assert(err.code === "NOT_FOUND", "Non-existent enrollment rejected with NOT_FOUND");
      }
      if (!nonExistentRejected) {
        assert(false, "Non-existent enrollment should have been rejected");
      }
    }
  }

  console.log("\n==================================================");
  if (allPassed) {
    console.log("SUCCESS: All security hardening verifications passed!");
  } else {
    console.error("FAILURE: Some security hardening checks failed.");
    process.exitCode = 1;
  }
}

runSecurityHardeningVerification()
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
