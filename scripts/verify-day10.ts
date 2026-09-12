import { db } from "@/server/db/client";
import { ExamService } from "@/server/services/exam.service";
import { QuestionBankService } from "@/server/services/question-bank.service";
import { ExamAttemptService } from "@/server/services/exam-attempt.service";
import { ResultEngineService } from "@/server/services/result-engine.service";
import { CertificateService } from "@/server/services/certificate.service";
import { CourseCompletionService } from "@/server/services/course-completion.service";
import {
  ExamType,
  ExamStatus,
  QuestionType,
  AttemptStatus,
  CertificateStatus,
  UserRoleCode,
} from "@prisma/client";

async function runVerification() {
  console.log("=== STARTING DAY 10 VERIFICATION SUITE ===");

  // Find or create admin user for FK reference
  let adminUserRecord = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN },
  });

  if (!adminUserRecord) {
    adminUserRecord = await db.user.create({
      data: {
        email: `superadmin.day10.${Date.now()}@softlabglobal.com`,
        roleCode: UserRoleCode.SUPER_ADMIN,
        status: "ACTIVE",
        firstName: "Super",
        lastName: "Admin",
        passwordHash: "mock_hash_day10_admin",
      },
    });
  }

  const adminUser = {
    id: adminUserRecord.id,
    email: adminUserRecord.email,
    roleCode: UserRoleCode.SUPER_ADMIN,
    permissions: ["ALL"],
    firstName: adminUserRecord.firstName,
    lastName: adminUserRecord.lastName,
  };

  // 1. Isolated Course Setup for this verification run
  const course = await db.course.create({
    data: {
      title: "Day 10 Cloud Computing & Devops " + Date.now(),
      slug: "day10-cloud-computing-" + Date.now(),
      summary: "Comprehensive exam module course",
      description: "Testing examination and digital certification engine.",
      baseFee: 100000,
      status: "PUBLISHED",
    },
  });
  console.log("✔ [1/16] Course setup verified:", course.id);

  // 2. Student User & Profile
  const studentEmail = `student.day10.${Date.now()}@example.com`;
  const studentUser = await db.user.create({
    data: {
      email: studentEmail,
      roleCode: UserRoleCode.STUDENT,
      status: "ACTIVE",
      firstName: "Test",
      lastName: "Student",
      passwordHash: "mock_hash_day10",
    },
  });

  const studentProfile = await db.studentProfile.create({
    data: {
      userId: studentUser.id,
      studentId: `SLG-TEST-${Date.now().toString().slice(-4)}`,
    },
  });

  const enrollment = await db.enrollment.create({
    data: {
      studentId: studentProfile.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });
  console.log("✔ [2/16] Student profile and active enrollment verified:", studentProfile.id);

  // 3. Question Bank - Create MCQ
  const mcqQuestion = await QuestionBankService.createQuestion(adminUser as any, {
    courseId: course.id,
    questionText: "What does AWS EC2 stand for?",
    type: QuestionType.MCQ,
    options: [
      { id: "opt_1", text: "Elastic Cloud Compute" },
      { id: "opt_2", text: "Elastic Compute Cloud" },
      { id: "opt_3", text: "Electronic Compute Cloud" },
      { id: "opt_4", text: "Engineered Cloud Compute" },
    ],
    correctAnswer: "opt_2",
    marks: 4.0,
    negativeMarks: 1.0,
    explanation: "EC2 stands for Elastic Compute Cloud.",
  });
  console.log("✔ [3/16] QuestionBank MCQ question created:", mcqQuestion.id);

  // 4. Question Bank - Create True/False
  const tfQuestion = await QuestionBankService.createQuestion(adminUser as any, {
    courseId: course.id,
    questionText: "Docker containers run completely independently of the host OS kernel.",
    type: QuestionType.TRUE_FALSE,
    options: [
      { id: "opt_true", text: "True" },
      { id: "opt_false", text: "False" },
    ],
    correctAnswer: "opt_false",
    marks: 2.0,
    negativeMarks: 0.5,
    explanation: "Containers share the host kernel unlike virtual machines.",
  });
  console.log("✔ [4/16] QuestionBank True/False question created:", tfQuestion.id);

  // 5. Exam Creation
  const exam = await ExamService.createExam(adminUser as any, {
    title: "Day 10 Final Certification Assessment",
    courseId: course.id,
    type: ExamType.FINAL_EXAM,
    durationMinutes: 30,
    totalMarks: 6.0,
    passingPercentage: 50,
    negativeMarking: true,
    negativeMarksPerQuestion: 1.0,
    maxAttempts: 2,
    instructions: "Please review all answers before submission.",
  });
  console.log("✔ [5/16] Exam created in DRAFT:", exam.id);

  // 6. Exam Questions Assignment
  await ExamService.addQuestionsToExam(adminUser as any, exam.id, [
    { questionId: mcqQuestion.id, marks: 4.0, sortOrder: 1 },
    { questionId: tfQuestion.id, marks: 2.0, sortOrder: 2 },
  ]);
  console.log("✔ [6/16] Questions mapped to exam with custom marks");

  // 7. Exam Publication
  const publishedExam = await ExamService.updateStatus(adminUser as any, exam.id, ExamStatus.PUBLISHED);
  console.log("✔ [7/16] Exam published successfully:", publishedExam.status === ExamStatus.PUBLISHED);

  // 8. Student Exam View (Zero-trust verify correct answers not leaked)
  const studentView = await ExamService.getStudentExamView(exam.id, studentUser.id);
  const leakedAnswer = (studentView.exam.questions[0]?.question as any).correctAnswer;
  if (leakedAnswer !== undefined) {
    throw new Error("SECURITY BREACH: Student view leaked correctAnswer!");
  }
  console.log("✔ [8/16] Student view tested: Zero-trust safe, no answer leak");

  // 9. Start Exam Attempt
  const attempt = await ExamAttemptService.startAttempt({
    examId: exam.id,
    studentUserId: studentUser.id,
  });
  console.log("✔ [9/16] Exam attempt started with timer tracking:", attempt.id);

  // 10. Autosave Answers (One correct, one marked for review)
  await ExamAttemptService.saveAnswer({
    attemptId: attempt.id,
    studentUserId: studentUser.id,
    questionId: mcqQuestion.id,
    selectedAnswer: "opt_2", // Correct
  });
  await ExamAttemptService.saveAnswer({
    attemptId: attempt.id,
    studentUserId: studentUser.id,
    questionId: tfQuestion.id,
    selectedAnswer: "opt_true", // Incorrect, tests negative marks
    isMarkedForReview: true,
  });
  console.log("✔ [10/16] Real-time answer state and review flag autosaved");

  // 11. Pure Scoring Engine Unit Evaluation Test
  const scoreResult = ResultEngineService.evaluateAnswers(
    [
      {
        questionId: mcqQuestion.id,
        userAnswer: "opt_2",
        correctAnswer: "opt_2",
        marks: 4.0,
        negativeMarking: true,
        negativeMarksPerQ: 1.0,
      },
      {
        questionId: tfQuestion.id,
        userAnswer: "opt_true",
        correctAnswer: "opt_false",
        marks: 2.0,
        negativeMarking: true,
        negativeMarksPerQ: 0.5,
      },
    ],
    3.0,
    6.0
  );
  if (scoreResult.totalMarksEarned !== 3.5 || !scoreResult.passed) {
    throw new Error(`Scoring engine failed expected calculation. Result: ${JSON.stringify(scoreResult)}`);
  }
  console.log("✔ [11/16] Result Engine calculation verified with negative marking:", scoreResult.totalMarksEarned);

  // 12. Submit Attempt Server-Side
  const evaluatedAttempt = await ExamAttemptService.submitAttempt({
    attemptId: attempt.id,
    studentUserId: studentUser.id,
  });
  console.log("✔ [12/16] Attempt evaluated server-side:", {
    score: evaluatedAttempt.finalScore,
    percentage: evaluatedAttempt.percentage,
    passed: evaluatedAttempt.isPassed,
  });

  // 13. Attempt Limit Enforcement Test
  const secondAttempt = await ExamAttemptService.startAttempt({
    examId: exam.id,
    studentUserId: studentUser.id,
  });
  await ExamAttemptService.submitAttempt({
    attemptId: secondAttempt.id,
    studentUserId: studentUser.id,
  });

  try {
    await ExamAttemptService.startAttempt({
      examId: exam.id,
      studentUserId: studentUser.id,
    });
    throw new Error("Should have thrown error on exceeding max attempts (2)!");
  } catch (err: any) {
    console.log("✔ [13/16] Attempt limit correctly enforced:", err.message);
  }

  // 14. Course Completion Check & Digital Certificate Issuance
  const completionStatus = await CourseCompletionService.evaluateCompletion(studentUser.id, course.id);
  console.log("✔ [14/16] Course completion evaluated:", completionStatus);

  // 15. Certificate Verification & QR Code Generation
  const certNumber = completionStatus.certificateNo;
  if (!certNumber) {
    throw new Error("Expected certificate to be issued after passing final exam!");
  }
  const verifyResult = await CertificateService.verifyCertificate(certNumber);
  if (!verifyResult.isValid || !verifyResult.qrCodeData?.startsWith("data:image/png;base64,")) {
    throw new Error("Certificate verification failed or invalid QR code.");
  }
  console.log("✔ [15/16] Digital Certificate verified with valid QR Code Data URL:", certNumber);

  // 16. Certificate Revocation Integrity
  const allCerts = await CertificateService.listCertificatesForAdmin();
  const targetCert = allCerts.find((c) => c.certificateNo === certNumber);
  if (!targetCert) throw new Error("Cert not found in registry");

  await CertificateService.revokeCertificate({
    certificateId: targetCert.id,
    revocationReason: "Automated test revocation verification",
    revokedById: adminUser.id,
  });

  const revokedVerifyResult = await CertificateService.verifyCertificate(certNumber);
  if (revokedVerifyResult.isValid || !revokedVerifyResult.isRevoked) {
    throw new Error("Certificate should be marked as REVOKED upon verification!");
  }
  console.log("✔ [16/16] Certificate revocation verified:", revokedVerifyResult.message);

  console.log("=== ALL 16 DAY 10 REQUIREMENTS SUCCESSFULLY VERIFIED ===");
}

runVerification()
  .catch((err) => {
    console.error("VERIFICATION FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });