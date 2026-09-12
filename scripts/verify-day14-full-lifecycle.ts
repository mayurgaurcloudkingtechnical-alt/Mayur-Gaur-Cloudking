import { db } from "../src/server/db/client";
import { NotificationService } from "../src/server/services/notification.service";
import { SystemHealthService } from "../src/server/services/system-health.service";
import { AnalyticsService } from "../src/server/services/analytics.service";
import { ReportGeneratorService } from "../src/server/services/report-generator.service";
import { CertificateService } from "../src/server/services/certificate.service";
import { ResultEngineService } from "../src/server/services/result-engine.service";
import { CorporatePartnerService } from "../src/server/services/corporate-partner.service";
import { JobDriveService } from "../src/server/services/job-drive.service";
import { PlacementApplicationService } from "../src/server/services/placement-application.service";
import { StaffProfileService } from "../src/server/services/staff-profile.service";
import { LeaveManagementService } from "../src/server/services/leave-management.service";
import { PayrollService } from "../src/server/services/payroll.service";
import { AuthenticatedUser } from "../src/server/auth/rbac";
import {
  UserRoleCode,
  JobType,
  JobDriveStatus,
  LeaveType,
  LeaveRequestStatus,
  StaffDepartment,
  PaymentMethod,
  PaymentTransactionStatus,
  FeeStructureStatus,
  FeePaymentStatus,
  EnrollmentStatus,
  LeadSource,
  LeadStatus,
  NotificationType,
} from "@prisma/client";

async function main() {
  console.log("================================================================================");
  console.log("   DAY 14 GRAND FULL-LIFECYCLE E2E RELEASE VERIFICATION: SOFTLAB GLOBAL       ");
  console.log("================================================================================");

  const stamp = Date.now();
  let adminUser = await db.user.findFirst({
    where: { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN] } },
  });
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        email: `admin-e2e-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "System",
        lastName: "Admin",
        roleCode: UserRoleCode.SUPER_ADMIN,
      },
    });
  }

  const adminActor: AuthenticatedUser = {
    id: adminUser.id,
    email: adminUser.email,
    roleCode: adminUser.roleCode,
    permissions: ["*"],
    firstName: adminUser.firstName,
    lastName: adminUser.lastName,
  };

  let studentUser: any, counselorUser: any, staffUser: any;
  let studentProfile: any, staffProfile: any;
  let course: any, enrollment: any, feeStructure: any, paymentTx: any;
  let certificate: any, partner: any, drive: any, placementApp: any;
  let leaveReq: any, payrollRec: any, testNotif2: any;

  try {
    // Part 1: Universal Notifications & Multi-Tenant Privacy Isolation
    console.log("\n[Part 1] Testing Universal Notifications & Multi-Tenant Isolation...");
    studentUser = await db.user.create({
      data: {
        email: `student.e2e.${stamp}@example.com`,
        passwordHash: "hash123",
        firstName: "Aarav",
        lastName: "Sharma",
        roleCode: UserRoleCode.STUDENT,
      },
    });

    counselorUser = await db.user.create({
      data: {
        email: `counselor.e2e.${stamp}@example.com`,
        passwordHash: "hash123",
        firstName: "Priya",
        lastName: "Verma",
        roleCode: UserRoleCode.COUNSELOR,
      },
    });

    await NotificationService.sendNotification({
      userId: studentUser.id,
      title: "Welcome to SOFTLAB GLOBAL",
      message: "Your student portal account has been provisioned.",
      type: NotificationType.SYSTEM,
    });

    testNotif2 = await NotificationService.sendNotification({
      userId: counselorUser.id,
      title: "New Lead Assigned",
      message: "You have been assigned a new prospect lead.",
      type: NotificationType.ADMISSION,
    });

    const studentNotifs = await NotificationService.listUserNotifications(studentUser.id);
    console.log(`  ✓ Student notifications: total=${studentNotifs.total}, unread=${studentNotifs.unreadCount}`);
    if (studentNotifs.unreadCount !== 1) throw new Error("Unread counter mismatch for student.");

    let privacyBlocked = false;
    try {
      await NotificationService.markAsRead(studentUser.id, testNotif2.id);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") privacyBlocked = true;
    }
    if (!privacyBlocked) throw new Error("Tenant isolation failure: Cross-user mutation allowed!");
    console.log("  ✓ Multi-tenant notification privacy verified (FORBIDDEN on cross-tenant mutation).");

    // Part 2: Lead CRM (Day 7) & Admission/Enrollment Flow (Day 7/8)
    console.log("\n[Part 2] Testing Lead CRM → Student Admission & Enrollment Flow...");
    course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
    if (!course) {
      course = await db.course.create({
        data: {
          title: `Full Stack Engineering Track ${stamp}`,
          slug: `fse-track-${stamp}`,
          summary: "Flagship Software Track",
          description: "Full Stack program",
          baseFee: 6500000,
          status: "PUBLISHED",
        },
      });
    }

    const lead = await db.lead.create({
      data: {
        fullName: "Aarav Sharma",
        email: studentUser.email,
        phone: `998877${stamp.toString().slice(-4)}`,
        source: LeadSource.WEBSITE,
        status: LeadStatus.ADMITTED,
        assignedToId: counselorUser.id,
      },
    });
    await NotificationService.notifyAdmission(counselorUser.id, lead.fullName, "ADMITTED");
    console.log("  ✓ Lead converted to ADMITTED; Counselor notified.");

    studentProfile = await db.studentProfile.create({
      data: {
        userId: studentUser.id,
        studentId: `SLG-STU-${stamp.toString().slice(-4)}`,
      },
    });

    enrollment = await db.enrollment.create({
      data: {
        studentId: studentProfile.id,
        courseId: course.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    console.log(`  ✓ StudentProfile & Enrollment created: ${studentProfile.studentId}`);

    // Part 3: Tuition Billing & Payment (Day 8/9)
    console.log("\n[Part 3] Testing Tuition Billing & Payment Receipt Recording...");
    feeStructure = await db.feeStructure.create({
      data: {
        studentId: studentProfile.id,
        enrollmentId: enrollment.id,
        courseId: course.id,
        totalCourseFee: 6500000,
        registrationFee: 0,
        netPayableAmount: 6500000,
        paidAmount: 6500000,
        pendingAmount: 0,
        paymentStatus: FeePaymentStatus.PAID,
        status: FeeStructureStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    paymentTx = await db.paymentTransaction.create({
      data: {
        feeStructureId: feeStructure.id,
        transactionReference: `PAY-E2E-${stamp}`,
        amount: 6500000,
        paymentMethod: PaymentMethod.RAZORPAY,
        status: PaymentTransactionStatus.SUCCESS,
        receivedById: adminUser.id,
      },
    });
    await NotificationService.notifyPaymentReceived(studentUser.id, 6500000, paymentTx.transactionReference);
    console.log("  ✓ Tuition payment ₹65,000 recorded; Student notified with receipt.");

    // Part 4: Exam Evaluation (Day 10) & Digital Certificate Issuance
    console.log("\n[Part 4] Testing Exam Evaluation & Digital Certificate Issuance...");
    const examScore = ResultEngineService.evaluateAnswers(
      [
        { questionId: "q1", userAnswer: "A", correctAnswer: "A", marks: 45, negativeMarking: false, negativeMarksPerQ: 0 },
        { questionId: "q2", userAnswer: "B", correctAnswer: "B", marks: 45, negativeMarking: false, negativeMarksPerQ: 0 },
      ],
      70,
      100
    );
    if (!examScore.passed || examScore.percentage !== 90) {
      throw new Error("Exam scoring engine failed pass evaluation.");
    }
    console.log(`  ✓ Exam scored: ${examScore.totalMarksEarned}/100 (${examScore.percentage}%) - Passed.`);

    certificate = await CertificateService.issueCertificate({
      studentProfileId: studentProfile.id,
      courseId: course.id,
      completionDate: new Date(),
    });
    await NotificationService.notifyCertificateIssued(studentUser.id, course.title, certificate.certificateNo);
    console.log(`  ✓ Certificate issued: ${certificate.certificateNo}; Student notified.`);

    // Part 5: Corporate Placement Drive & Student Application (Day 11)
    console.log("\n[Part 5] Testing Corporate Placement Drive & Application Pipeline...");
    partner = await CorporatePartnerService.createPartner(adminActor, {
      name: `Infosys Global ${stamp}`,
      industry: "Information Technology",
      website: "https://infosys.example.com",
    });

    drive = await JobDriveService.createJobDrive(adminActor, {
      companyId: partner.id,
      title: "Full Stack Software Engineer",
      jobType: JobType.FULL_TIME,
      description: "Full Stack Engineer needed.",
      targetCourseId: course.id,
      requireCertification: true,
      salaryPackage: "₹7.5 - 9.0 LPA",
      status: JobDriveStatus.ACTIVE,
    });
    await NotificationService.notifyPlacementDrive([studentUser.id], drive.title, partner.name);
    console.log(`  ✓ Placement Drive published (${drive.title}); Student notified.`);

    await PlacementApplicationService.upsertPlacementProfile(studentUser.id, {
      studentProfileId: studentProfile.id,
      headline: "Certified Full Stack Developer",
      skills: ["TypeScript", "Next.js", "PostgreSQL", "Prisma"],
    });

    placementApp = await PlacementApplicationService.applyForJobDrive(studentUser.id, {
      studentProfileId: studentProfile.id,
      jobDriveId: drive.id,
      coverNote: "Excited to apply!",
    });
    console.log(`  ✓ Student applied to drive: status=${placementApp.status}`);

    // Part 6: Staff HRMS, Leave Workflow & Payroll Engine (Day 12)
    console.log("\n[Part 6] Testing Staff HRMS, Leave Approval & Payroll Disbursement...");
    staffUser = await db.user.create({
      data: {
        email: `trainer.e2e.${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Karan",
        lastName: "Kapoor",
        roleCode: UserRoleCode.TRAINER,
      },
    });

    staffProfile = await StaffProfileService.createStaffProfile(adminActor, {
      userId: staffUser.id,
      employeeId: `SLG-EMP-E2E-${stamp.toString().slice(-4)}`,
      department: StaffDepartment.ACADEMICS,
      designation: "Senior Technical Trainer",
      baseSalary: 7500000,
    });

    leaveReq = await LeaveManagementService.applyForLeave(staffProfile.id, {
      leaveType: LeaveType.UNPAID,
      startDate: new Date("2026-09-01T00:00:00Z"),
      endDate: new Date("2026-09-02T00:00:00Z"),
      reason: "Personal",
    });
    await LeaveManagementService.reviewLeaveRequest(adminActor, leaveReq.id, {
      status: LeaveRequestStatus.APPROVED,
    });

    payrollRec = await PayrollService.generateStaffPayroll(adminActor, {
      staffId: staffProfile.id,
      month: 9,
      year: 2026,
    });

    const paidPayroll = await PayrollService.markPayrollPaid(adminActor, payrollRec.id, {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentReference: `NEFT-DISB-${stamp}`,
    });
    await NotificationService.notifyPayrollDisbursed(staffUser.id, paidPayroll.salarySlipNumber, paidPayroll.netSalary);
    console.log(`  ✓ Payroll processed: ${paidPayroll.salarySlipNumber} (Net: ₹${paidPayroll.netSalary / 100}); Staff notified.`);

    // Part 7: Executive BI Analytics & Audit CSV Export (Day 13)
    console.log("\n[Part 7] Testing Executive BI Analytics & Audit CSV Report Generation...");
    const overview = await AnalyticsService.getExecutiveOverview();
    console.log(`  ✓ Executive P&L: Revenue ₹${overview.financials.totalRevenuePaise / 100}, Payroll ₹${overview.financials.totalPayrollDisbursedPaise / 100}`);

    const cashflowExport = await ReportGeneratorService.generateFinancialCashflowReport(adminActor);
    console.log(`  ✓ Financial Cashflow CSV exported: ${cashflowExport.fileName} (${cashflowExport.recordCount} records)`);

    // Part 8: System Health Diagnostics (Day 14)
    console.log("\n[Part 8] Testing Deep System Health Diagnostics...");
    const health = await SystemHealthService.getHealthDiagnostics();
    console.log(`  ✓ System Health: ${health.status}, DB Latency: ${health.database.latencyMs}ms, Models: ${health.database.activeModelsCount}`);
    if (health.status !== "HEALTHY" || health.database.status !== "CONNECTED") {
      throw new Error("System health check returned non-healthy diagnostics!");
    }

    console.log("\n================================================================================");
    console.log("   🎉 GRAND FULL-LIFECYCLE E2E RELEASE VERIFICATION COMPLETED SUCCESSFULLY!    ");
    console.log("================================================================================");
  } finally {
    console.log("\n[Teardown] Cleaning up ephemeral test records...");
    try {
      if (payrollRec?.id) await db.payrollRecord.deleteMany({ where: { id: payrollRec.id } });
      if (leaveReq?.id) await db.leaveRequest.deleteMany({ where: { id: leaveReq.id } });
      if (staffProfile?.id) await db.staffProfile.deleteMany({ where: { id: staffProfile.id } });
      if (staffUser?.id) await db.user.deleteMany({ where: { id: staffUser.id } });
      if (placementApp?.id) await db.placementApplication.deleteMany({ where: { id: placementApp.id } });
      if (drive?.id) await db.jobDrive.deleteMany({ where: { id: drive.id } });
      if (partner?.id) await db.corporatePartner.deleteMany({ where: { id: partner.id } });
      if (certificate?.id) await db.certificate.deleteMany({ where: { id: certificate.id } });
      if (paymentTx?.id) await db.paymentTransaction.deleteMany({ where: { id: paymentTx.id } });
      if (feeStructure?.id) await db.feeStructure.deleteMany({ where: { id: feeStructure.id } });
      if (enrollment?.id) await db.enrollment.deleteMany({ where: { id: enrollment.id } });
      if (studentProfile?.id) { await db.studentPlacementProfile.deleteMany({ where: { studentId: studentProfile.id } }); await db.studentProfile.deleteMany({ where: { id: studentProfile.id } }); }
      if (studentUser?.id) { await db.notification.deleteMany({ where: { userId: studentUser.id } }); await db.user.deleteMany({ where: { id: studentUser.id } }); }
      if (counselorUser?.id) { await db.notification.deleteMany({ where: { userId: counselorUser.id } }); await db.lead.deleteMany({ where: { assignedToId: counselorUser.id } }); await db.user.deleteMany({ where: { id: counselorUser.id } }); }
      console.log("  ✓ Teardown completed cleanly.");
    } catch (cleanupErr) {
      console.error("  ⚠ Cleanup warning (non-fatal):", cleanupErr);
    }
  }
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
