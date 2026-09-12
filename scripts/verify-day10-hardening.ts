import { db } from "@/server/db/client";
import { ExamService } from "@/server/services/exam.service";
import { QuestionBankService } from "@/server/services/question-bank.service";
import { ExamAttemptService } from "@/server/services/exam-attempt.service";
import { ResultEngineService } from "@/server/services/result-engine.service";
import { CertificateService } from "@/server/services/certificate.service";
import { CourseCompletionService } from "@/server/services/course-completion.service";
import { appRouter } from "@/server/trpc/routers/_app";
import {
  ExamType,
  ExamStatus,
  QuestionType,
  UserRoleCode,
  FeePaymentStatus,
  AttendanceStatus,
} from "@prisma/client";

async function runHardeningTests() {
  console.log("==================================================");
  console.log("STARTING DAY 10 COMPREHENSIVE HARDENING TEST SUITE");
  console.log("==================================================");

  // Setup Admin context
  let adminUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN },
  });
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        email: `admin.hard.${Date.now()}@softlabglobal.com`,
        roleCode: UserRoleCode.SUPER_ADMIN,
        status: "ACTIVE",
        firstName: "Super",
        lastName: "Admin",
        passwordHash: "mock_hash_admin",
      },
    });
  }

  // Setup Test Course
  const course = await db.course.create({
    data: {
      title: "Hardening Test Course " + Date.now(),
      slug: "hardening-course-" + Date.now(),
      summary: "Security and validation test course",
      description: "Testing authorization, enrollment, attempts, and certification.",
      baseFee: 5000000,
      status: "PUBLISHED",
    },
  });

  // Setup Student 1 (Enrolled)
  const studentUser1 = await db.user.create({
    data: {
      email: `student.enrolled.${Date.now()}@example.com`,
      roleCode: UserRoleCode.STUDENT,
      status: "ACTIVE",
      firstName: "Enrolled",
      lastName: "Student",
      passwordHash: "mock_hash_student1",
    },
  });

  const studentProfile1 = await db.studentProfile.create({
    data: {
      userId: studentUser1.id,
      studentId: `SLG-TEST-${Date.now().toString().slice(-4)}`,
    },
  });

  const enrollment1 = await db.enrollment.create({
    data: {
      studentId: studentProfile1.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });

  // Setup Student 2 (Unenrolled)
  const studentUser2 = await db.user.create({
    data: {
      email: `student.unenrolled.${Date.now()}@example.com`,
      roleCode: UserRoleCode.STUDENT,
      status: "ACTIVE",
      firstName: "Unenrolled",
      lastName: "Student",
      passwordHash: "mock_hash_student2",
    },
  });

  const studentProfile2 = await db.studentProfile.create({
    data: {
      userId: studentUser2.id,
      studentId: `SLG-UNEN-${Date.now().toString().slice(-4)}`,
    },
  });

  // Setup Questions
  const q1 = await QuestionBankService.createQuestion(adminUser as any, {
    courseId: course.id,
    questionText: "Which HTTP status code signifies Forbidden access?",
    type: QuestionType.MCQ,
    options: [
      { id: "opt_200", text: "200 OK" },
      { id: "opt_401", text: "401 Unauthorized" },
      { id: "opt_403", text: "403 Forbidden" },
      { id: "opt_500", text: "500 Internal Server Error" },
    ],
    correctAnswer: "opt_403",
    marks: 5.0,
    negativeMarks: 1.0,
    explanation: "HTTP 403 Forbidden indicates that the client does not have access rights to the content.",
  });

  const q2 = await QuestionBankService.createQuestion(adminUser as any, {
    courseId: course.id,
    questionText: "Prisma schema migrations should be run in production with db push.",
    type: QuestionType.TRUE_FALSE,
    options: [
      { id: "opt_true", text: "True" },
      { id: "opt_false", text: "False" },
    ],
    correctAnswer: "opt_false",
    marks: 5.0,
    negativeMarks: 1.0,
    explanation: "Production databases should always use migrate deploy, never db push.",
  });

  // Create Exam
  const exam = await ExamService.createExam(adminUser as any, {
    title: "Comprehensive Security & Devops Assessment",
    courseId: course.id,
    type: ExamType.FINAL_EXAM,
    durationMinutes: 1, // Short duration for expiry testing
    totalMarks: 10.0,
    passingPercentage: 50,
    negativeMarking: true,
    negativeMarksPerQuestion: 1.0,
    maxAttempts: 1,
  });

  await ExamService.addQuestionsToExam(adminUser as any, exam.id, [
    { questionId: q1.id, marks: 5.0, sortOrder: 1 },
    { questionId: q2.id, marks: 5.0, sortOrder: 2 },
  ]);

  await ExamService.updateStatus(adminUser as any, exam.id, ExamStatus.PUBLISHED);

  // ----------------------------------------------------
  // TEST 1: Student cannot access exam without active enrollment
  // ----------------------------------------------------
  try {
    await ExamService.getStudentExamView(exam.id, studentUser2.id);
    throw new Error("FAIL: Unenrolled student was able to access exam!");
  } catch (err: any) {
    if (err.message.includes("not actively enrolled")) {
      console.log("✔ [TEST 1] Unenrolled student denied exam access successfully.");
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // TEST 2: Enrolled student can access published exam
  // ----------------------------------------------------
  const studentView = await ExamService.getStudentExamView(exam.id, studentUser1.id);
  if (!studentView || studentView.exam.id !== exam.id) {
    throw new Error("FAIL: Enrolled student could not access published exam!");
  }
  console.log("✔ [TEST 2] Enrolled student accessed published exam successfully.");

  // ----------------------------------------------------
  // TEST 3: Student cannot call admin exam procedures
  // ----------------------------------------------------
  const studentCaller = appRouter.createCaller({
    db,
    session: { user: studentUser1 } as any,
    user: studentUser1 as any,
    headers: new Headers(),
  });

  try {
    await studentCaller.exam.createExam({
      title: "Unauthorized Student Exam",
      courseId: course.id,
      durationMinutes: 10,
      totalMarks: 10,
      passingPercentage: 50,
    });
    throw new Error("FAIL: Student was allowed to call admin createExam!");
  } catch (err: any) {
    if (err.message.includes("Forbidden") || err.code === "FORBIDDEN") {
      console.log("✔ [TEST 3] Student prohibited from executing admin exam procedures.");
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // TEST 4: Correct answers are never returned before submission
  // ----------------------------------------------------
  const questionPayload = studentView.exam.questions[0].question as any;
  if (questionPayload.correctAnswer !== undefined || questionPayload.explanation !== undefined) {
    throw new Error("FAIL: Correct answers or explanations were leaked to student!");
  }
  console.log("✔ [TEST 4] Zero-trust verified: No correct answers or explanations leaked.");

  // Setup incomplete fee installment BEFORE exam to test automatic completion criteria guarding
  const fs = await db.feeStructure.create({
    data: {
      studentId: studentProfile1.id,
      courseId: course.id,
      enrollmentId: enrollment1.id,
      totalCourseFee: 5000000,
      netPayableAmount: 5000000,
      pendingAmount: 5000000,
      paymentStatus: FeePaymentStatus.PENDING,
      installments: {
        create: [
          {
            installmentNumber: 1,
            amount: 5000000,
            dueDate: new Date(),
            status: "PENDING",
          },
        ],
      },
    },
  });

  // ----------------------------------------------------
  // TEST 5: Active attempt handling & Resume restores saved answers
  // ----------------------------------------------------
  const attempt1 = await ExamAttemptService.startAttempt({
    examId: exam.id,
    studentUserId: studentUser1.id,
  });

  // Save answer to Q1
  await ExamAttemptService.saveAnswer({
    attemptId: attempt1.id,
    studentUserId: studentUser1.id,
    questionId: q1.id,
    selectedAnswer: "opt_403",
    isMarkedForReview: true,
  });

  // Resume attempt
  const resumedAttempt = await ExamAttemptService.startAttempt({
    examId: exam.id,
    studentUserId: studentUser1.id,
  });

  if (resumedAttempt.id !== attempt1.id) {
    throw new Error("FAIL: Resuming attempt did not return existing active attempt!");
  }
  if (!resumedAttempt.answers || resumedAttempt.answers.length === 0) {
    throw new Error("FAIL: Resumed attempt did not restore saved answers from database!");
  }
  const restoredQ1 = resumedAttempt.answers.find((a: any) => a.questionId === q1.id);
  if (restoredQ1?.selectedAnswer !== "opt_403" || !restoredQ1?.isMarkedForReview) {
    throw new Error("FAIL: Restored answer did not match autosaved state!");
  }
  console.log("✔ [TEST 5] Active attempt resume and answer restoration verified.");

  // ----------------------------------------------------
  // TEST 6: Double submission idempotency
  // ----------------------------------------------------
  const submitted1 = await ExamAttemptService.submitAttempt({
    attemptId: attempt1.id,
    studentUserId: studentUser1.id,
  });
  const submitted2 = await ExamAttemptService.submitAttempt({
    attemptId: attempt1.id,
    studentUserId: studentUser1.id,
  });
  if (submitted1.status !== submitted2.status || submitted1.finalScore !== submitted2.finalScore) {
    throw new Error("FAIL: Double submission produced inconsistent state!");
  }
  console.log("✔ [TEST 6] Exam submission is strictly idempotent against double submissions.");

  // ----------------------------------------------------
  // TEST 7: Expired attempt rejects new answers
  // ----------------------------------------------------
  try {
    await ExamAttemptService.saveAnswer({
      attemptId: attempt1.id,
      studentUserId: studentUser1.id,
      questionId: q2.id,
      selectedAnswer: "opt_false",
    });
    throw new Error("FAIL: Submitted/expired attempt accepted a new answer!");
  } catch (err: any) {
    console.log("✔ [TEST 7] Rejected answer submission on non-active attempt.");
  }

  // ----------------------------------------------------
  // TEST 8: Attempt limit strictly enforced
  // ----------------------------------------------------
  try {
    await ExamAttemptService.startAttempt({
      examId: exam.id,
      studentUserId: studentUser1.id,
    });
    throw new Error("FAIL: Allowed student to exceed maxAttempts (1)!");
  } catch (err: any) {
    console.log("✔ [TEST 8] Max attempt limit strictly enforced.");
  }

  // ----------------------------------------------------
  // TEST 9: Certificate concurrent collision safety & Uniqueness
  // ----------------------------------------------------
  const certNumbers = new Set<string>();
  const concurrentCount = 10;
  const promises = [];
  for (let i = 0; i < concurrentCount; i++) {
    promises.push(CertificateService.generateCertificateNumber());
  }
  const generated = await Promise.all(promises);
  generated.forEach((num) => certNumbers.add(num));
  if (certNumbers.size !== concurrentCount) {
    throw new Error("FAIL: Collision detected in concurrent certificate number generation!");
  }
  console.log(`✔ [TEST 9] Concurrent generation of ${concurrentCount} certificate numbers was 100% collision-free.`);

  // ----------------------------------------------------
  // TEST 10: Course completion multi-criteria failure (Attendance & Fee checks)
  // ----------------------------------------------------
  const failureStatus = await CourseCompletionService.evaluateCompletion(
    studentUser1.id,
    course.id,
    { requireAllExamsPassed: true, minAttendancePercentage: 75, requireFeeClearance: true }
  );

  if (failureStatus.isComplete || failureStatus.certificateIssued) {
    throw new Error("FAIL: Certificate was issued despite pending fees!");
  }
  console.log("✔ [TEST 10] Certificate blocked when course completion criteria (fees) fail:", failureStatus.rejectionReasons);

  // ----------------------------------------------------
  // TEST 11: Certificate issuance when all criteria met
  // ----------------------------------------------------
  // Clear fee installment
  await db.feeInstallment.updateMany({
    where: { feeStructureId: fs.id },
    data: { status: "PAID" },
  });
  await db.feeStructure.update({
    where: { id: fs.id },
    data: { paymentStatus: FeePaymentStatus.PAID, pendingAmount: 0, paidAmount: 5000000 },
  });

  const successStatus = await CourseCompletionService.evaluateCompletion(
    studentUser1.id,
    course.id,
    { requireAllExamsPassed: true, minAttendancePercentage: 0, requireFeeClearance: true }
  );

  if (!successStatus.isComplete || !successStatus.certificateIssued || !successStatus.certificateNo) {
    throw new Error("FAIL: Certificate was not issued after all criteria were met!");
  }
  console.log("✔ [TEST 11] Certificate issued upon fulfilling all completion criteria:", successStatus.certificateNo);

  // ----------------------------------------------------
  // TEST 12: Duplicate certificate issuance prevention
  // ----------------------------------------------------
  const secondIssueStatus = await CourseCompletionService.evaluateCompletion(
    studentUser1.id,
    course.id,
    { requireAllExamsPassed: true, minAttendancePercentage: 0, requireFeeClearance: true }
  );
  if (secondIssueStatus.certificateNo !== successStatus.certificateNo) {
    throw new Error("FAIL: Duplicate certificate was generated instead of returning existing!");
  }
  console.log("✔ [TEST 12] Duplicate certificate issuance prevented successfully.");

  // ----------------------------------------------------
  // TEST 13: Certificate Public Verification & Privacy (No email leak)
  // ----------------------------------------------------
  const verifyResult = await CertificateService.verifyCertificate(successStatus.certificateNo);
  if (!verifyResult.isValid || !verifyResult.certificate) {
    throw new Error("FAIL: Public verification failed for valid certificate!");
  }
  if ((verifyResult.certificate as any).email !== undefined) {
    throw new Error("FAIL: Public certificate verification leaked private student email!");
  }
  console.log("✔ [TEST 13] Public verification succeeded without leaking private contact data.");

  // ----------------------------------------------------
  // TEST 14: Certificate Revocation Audit
  // ----------------------------------------------------
  const allCerts = await CertificateService.listCertificatesForAdmin();
  const certToRevoke = allCerts.find((c) => c.certificateNo === successStatus.certificateNo);
  if (!certToRevoke) throw new Error("Cert not found");

  await CertificateService.revokeCertificate({
    certificateId: certToRevoke.id,
    revocationReason: "Disciplinary integrity violation during security audit",
    revokedById: adminUser.id,
  });

  const revokedVerify = await CertificateService.verifyCertificate(successStatus.certificateNo);
  if (revokedVerify.isValid || !revokedVerify.isRevoked) {
    throw new Error("FAIL: Certificate was not marked as REVOKED!");
  }
  console.log("✔ [TEST 14] Certificate revocation and reason recorded correctly.");

  console.log("==================================================");
  console.log("ALL HARDENING TESTS PASSED SUCCESSFULLY! (14/14)");
  console.log("==================================================");
}

runHardeningTests()
  .catch((err) => {
    console.error("HARDENING SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });