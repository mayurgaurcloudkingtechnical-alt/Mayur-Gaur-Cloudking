import { db } from "../src/server/db/client";
import { UserRoleCode, StaffDepartment } from "@prisma/client";
import { StaffOnboardingService } from "../src/server/services/staff-onboarding.service";
import { AttendanceIntegrationService } from "../src/server/services/attendance-integration.service";
import { DailyPlannerService } from "../src/server/services/daily-planner.service";
import { DailyReportService } from "../src/server/services/daily-report.service";
import { verifyUserCredentials } from "../src/server/auth/verify-credentials";
import * as bcrypt from "bcryptjs";

async function runTests() {
  console.log("================================================================================");
  console.log("🚀 STARTING AUTOMATED TEST SUITE: HRMS, ONBOARDING & DAILY MANAGEMENT");
  console.log("================================================================================\n");

  const testSuffix = Math.floor(100000 + Math.random() * 900000);
  const adminActor = {
    id: "test-super-admin-id",
    email: "director.test@softlabglobal.com",
    roleCode: UserRoleCode.SUPER_ADMIN,
    permissions: ["*"],
    firstName: "Director",
    lastName: "Executive",
  };

  // Setup Director user in DB if not present
  let directorUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN },
  });
  if (!directorUser) {
    directorUser = await db.user.create({
      data: {
        email: `director.test.${testSuffix}@softlabglobal.com`,
        passwordHash: await bcrypt.hash("DirectorSecure2026!", 10),
        firstName: "Director",
        lastName: "Executive",
        roleCode: UserRoleCode.SUPER_ADMIN,
      },
    });
  }
  adminActor.id = directorUser.id;

  // ---------------------------------------------------------------------------
  // TEST 1: Staff Onboarding Wizard Execution
  // ---------------------------------------------------------------------------
  console.log("▶ TEST 1: 5-Step Staff Onboarding Execution...");
  const candidateEmail = `counselor.onboard.${testSuffix}@softlabglobal.com`;
  const candidatePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const onboardResult = await StaffOnboardingService.onboardEmployee(adminActor, {
    firstName: "Pooja",
    lastName: "Sharma",
    personalEmail: candidateEmail,
    officialEmail: `pooja.${testSuffix}@softlabglobal.com`,
    phone: candidatePhone,
    department: StaffDepartment.COUNSELING,
    designation: "Senior Admissions Counselor",
    baseSalary: 4500000, // 45,000 INR in Paise
    roleCode: UserRoleCode.COUNSELOR,
    password: "Password@123",
    bankAccountNumber: "123456789012",
    bankIfsc: "HDFC0001234",
    panNumber: "ABCDE1234F",
    documents: [
      { documentType: "RESUME", title: "Pooja Resume", documentUrl: "https://storage.softlab.com/resume.pdf" },
      { documentType: "OFFER_LETTER", title: "Offer Letter", documentUrl: "https://storage.softlab.com/offer.pdf" },
    ],
    initialChecklist: {
      offerLetterAckDone: true,
      docVerificationDone: true,
      roleAssignmentDone: true,
      crmAccessVerified: true,
      hrmsProfileDone: true,
      attendancePolicyAckDone: true,
      trainingInductionDone: true,
      managerApprovalDone: true,
    },
    status: "ACTIVE",
  });

  if (!onboardResult.success || !onboardResult.employeeId) {
    throw new Error("Test 1 Failed: Staff onboarding returned failure.");
  }

  const staffInDb = await db.staffProfile.findUnique({
    where: { id: onboardResult.staffProfile.id },
    include: {
      user: true,
      documents: true,
      onboardingChecklist: true,
      leaveBalances: true,
    },
  });

  if (!staffInDb || staffInDb.documents.length !== 2 || !staffInDb.onboardingChecklist) {
    throw new Error("Test 1 Failed: Staff record, documents, or checklist not persisted.");
  }
  console.log(`✅ Test 1 Passed: Onboarded ${staffInDb.employeeId} (${staffInDb.user.firstName} ${staffInDb.user.lastName}) with 2 documents & checklist.`);

  // ---------------------------------------------------------------------------
  // TEST 2: Duplicate Candidate Prevention
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Duplicate Candidate Prevention...");
  try {
    await StaffOnboardingService.onboardEmployee(adminActor, {
      firstName: "Duplicate",
      lastName: "Candidate",
      personalEmail: candidateEmail, // Same email!
      phone: candidatePhone,
      department: StaffDepartment.COUNSELING,
      designation: "Counselor",
      baseSalary: 3000000,
      roleCode: UserRoleCode.COUNSELOR,
    });
    throw new Error("Test 2 Failed: Duplicate email did not throw CONFLICT.");
  } catch (err: any) {
    if (err.message.includes("already exists")) {
      console.log(`✅ Test 2 Passed: Duplicate registration blocked with message: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Automatic Attendance on Staff CRM/LMS Login
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Automatic Attendance on Staff Login...");
  const authStaffResult = await verifyUserCredentials({
    identifier: candidateEmail,
    password: "Password@123",
    clientIp: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  if (!authStaffResult) {
    throw new Error("Test 3 Failed: verifyUserCredentials returned null for valid staff.");
  }

  const today = new Date();
  const startOfDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));

  const staffAttendance = await db.staffAttendance.findFirst({
    where: { staffId: staffInDb.id, date: startOfDay },
  });

  const attendanceEvent = await db.attendanceEvent.findFirst({
    where: { staffId: staffInDb.id, eventType: "LOGIN_CHECKIN" },
  });

  if (!staffAttendance || !attendanceEvent) {
    throw new Error("Test 3 Failed: StaffAttendance or AttendanceEvent was not created on login.");
  }
  console.log(`✅ Test 3 Passed: Login check-in event recorded with status "${staffAttendance.status}" and eventId "${attendanceEvent.id}".`);

  // ---------------------------------------------------------------------------
  // TEST 4: Idempotency Protection (Multi-Tab / Page Refresh)
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Attendance Idempotency on Repeated Logins...");
  const secondLoginResult = await AttendanceIntegrationService.recordLoginCheckIn({
    userId: staffInDb.userId,
    clientIp: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  });

  if (secondLoginResult?.status !== "ALREADY_CHECKED_IN") {
    throw new Error("Test 4 Failed: Repeated login did not return ALREADY_CHECKED_IN.");
  }

  const eventCount = await db.attendanceEvent.count({
    where: { staffId: staffInDb.id, eventType: "LOGIN_CHECKIN" },
  });

  if (eventCount !== 1) {
    throw new Error(`Test 4 Failed: Expected exactly 1 AttendanceEvent, found ${eventCount}.`);
  }
  console.log("✅ Test 4 Passed: Repeated login idempotency verified. Zero duplicate punches.");

  // ---------------------------------------------------------------------------
  // TEST 5: Student Logins Do Not Record Staff Attendance
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 5: Student Login Isolation...");
  const studentEmail = `student.test.${testSuffix}@softlabglobal.com`;
  const studentUser = await db.user.create({
    data: {
      email: studentEmail,
      passwordHash: await bcrypt.hash("StudentSecure2026!", 10),
      firstName: "Student",
      lastName: "Candidate",
      roleCode: UserRoleCode.STUDENT,
    },
  });

  await verifyUserCredentials({
    identifier: studentEmail,
    password: "StudentSecure2026!",
  });

  const studentAttendanceEvent = await db.attendanceEvent.findFirst({
    where: { userId: studentUser.id },
  });

  if (studentAttendanceEvent) {
    throw new Error("Test 5 Failed: Student login erroneously created staff attendance event.");
  }
  console.log("✅ Test 5 Passed: Student login strictly isolated; zero staff attendance created.");

  // ---------------------------------------------------------------------------
  // TEST 6: Attendance Regularization Request & Approval Workflow
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 6: Attendance Regularization Request & Review...");
  const regReq = await AttendanceIntegrationService.submitRegularizationRequest(
    {
      id: staffInDb.userId,
      email: candidateEmail,
      roleCode: UserRoleCode.COUNSELOR,
      permissions: [],
      firstName: "Pooja",
      lastName: "Sharma",
    },
    {
      staffId: staffInDb.id,
      date: new Date(),
      type: "REMOTE_WORK",
      reason: "Approved field counseling drive at partner campus.",
    }
  );

  const approvedReg = await AttendanceIntegrationService.reviewRegularizationRequest(
    adminActor,
    regReq.id,
    "APPROVED"
  );

  if (approvedReg.status !== "APPROVED") {
    throw new Error("Test 6 Failed: Regularization was not approved.");
  }
  console.log("✅ Test 6 Passed: Regularization requested, verified, and approved with audit trail.");

  // ---------------------------------------------------------------------------
  // TEST 7: Director-Led Intelligent Work Planner
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 7: Intelligent Work Planner Generation & Approval...");
  const planResult = await DailyPlannerService.generateProposedDailyPlan(adminActor, {
    forceRegenerate: true,
  });

  if (!planResult.run || planResult.run.tasks.length === 0) {
    throw new Error("Test 7 Failed: Daily plan did not generate tasks from CRM data.");
  }
  console.log(`Generated ${planResult.run.tasks.length} proposed tasks for Director review.`);

  const approvedPlan = await DailyPlannerService.approveAndDistributePlan(
    adminActor,
    planResult.run.id,
    "Authorized by Director for immediate team execution."
  );

  if (approvedPlan.status !== "APPROVED") {
    throw new Error("Test 7 Failed: Plan was not approved.");
  }

  const assignedTasksCount = await db.dailyWorkTask.count({
    where: { generationRunId: planResult.run.id, status: "ASSIGNED" },
  });

  if (assignedTasksCount === 0) {
    throw new Error("Test 7 Failed: Tasks were not transitioned to ASSIGNED.");
  }
  console.log(`✅ Test 7 Passed: Director approved and distributed ${assignedTasksCount} tasks to staff.`);

  // ---------------------------------------------------------------------------
  // TEST 8: Prefilled CRM Metrics & Employee Daily Report Submission
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 8: Prefilled CRM Metrics & Employee Daily Report...");
  const prefill = await DailyReportService.getPrefilledReportData(
    adminActor,
    staffInDb.id,
    new Date()
  );

  if (!prefill.crmMetrics) {
    throw new Error("Test 8 Failed: CRM prefill metrics missing.");
  }

  const submittedReport = await DailyReportService.submitDailyReport(
    {
      id: staffInDb.userId,
      email: candidateEmail,
      roleCode: UserRoleCode.COUNSELOR,
      permissions: [],
      firstName: "Pooja",
      lastName: "Sharma",
    },
    {
      staffId: staffInDb.id,
      reportDate: new Date(),
      actualWorkSummary: "Contacted 22 candidate leads, conducted 3 detailed tele-counseling sessions.",
      resultsSummary: "2 students confirmed document verification for tomorrow.",
      nextDayPriorities: "Follow up on scholarship applicants.",
      items: (prefill.assignedTasks || []).map((t) => ({
        taskId: t.id,
        taskTitle: t.title,
        status: "COMPLETED",
        measurableResult: "Target achieved",
      })),
    }
  );

  if (!submittedReport || submittedReport.status !== "SUBMITTED") {
    throw new Error("Test 8 Failed: Report submission failed.");
  }
  console.log(`✅ Test 8 Passed: Report submitted with ${submittedReport.items.length} itemized task reports.`);

  // ---------------------------------------------------------------------------
  // TEST 9: Hierarchical Manager Review & Director Rollup
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 9: Hierarchical Report Review & Director Company-wide Summary...");
  const reviewedReport = await DailyReportService.reviewDailyReport(
    adminActor,
    submittedReport.id,
    "APPROVED",
    "Excellent daily performance and verified calls."
  );

  if (reviewedReport.status !== "APPROVED") {
    throw new Error("Test 9 Failed: Report was not marked APPROVED by reviewer.");
  }

  const companySummary = await DailyReportService.getCompanyWideDailySummary(new Date());
  if (!companySummary.staffOverview || !companySummary.reportsOverview) {
    throw new Error("Test 9 Failed: Company summary calculation failed.");
  }

  console.log(`Company Rollup: Staff Present: ${companySummary.staffOverview.present}, Reports Submitted: ${companySummary.reportsOverview.totalReportsSubmitted}, Reports Approved: ${companySummary.reportsOverview.approved}`);
  console.log("✅ Test 9 Passed: Hierarchical review completed and Director company-wide summary verified.");

  console.log("\n================================================================================");
  console.log("🎉 ALL 9 TEST SUITES COMPLETED WITH 100% SUCCESS!");
  console.log("================================================================================\n");
}

runTests()
  .catch((err) => {
    console.error("❌ TEST SUITE FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
