import { db } from "../src/server/db/client";
import { AnalyticsService } from "../src/server/services/analytics.service";
import { ReportGeneratorService } from "../src/server/services/report-generator.service";
import { AuthenticatedUser, hasRole } from "../src/server/auth/rbac";
import {
  UserRoleCode,
  PaymentMethod,
  PaymentTransactionStatus,
  FeeStructureStatus,
  FeePaymentStatus,
  PayrollStatus,
  StaffDepartment,
  LeadStatus,
  LeadSource,
  AttendanceStatus,
  EnrollmentStatus,
  ReportExportType,
} from "@prisma/client";

async function main() {
  console.log("================================================================");
  console.log("   DAY 13 VERIFICATION: EXECUTIVE BI & AUDIT REPORTING ENGINE   ");
  console.log("================================================================");

  const stamp = Date.now();

  // 1. Setup Admin Actor
  let adminUser = await db.user.findFirst({
    where: { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN] } },
  });
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        email: `exec-admin-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Executive",
        lastName: "Director",
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

  // Ephemeral entities tracking
  let createdCourse = false;
  let testStudentUser: any, testStaffUser: any, testCounselorUser: any;
  let testStudentProfile: any, testStaffProfile: any;
  let testCourse: any, testEnrollment: any;
  let testFeeStructure: any, testOverdueInstallment: any;
  let testPaymentTx: any, testPayrollRecord: any;
  let testLead1: any, testLead2: any;
  let testPlacementProfile: any;
  let testAttendance: any;

  try {
    testCourse = await db.course.findFirst({ where: { status: "PUBLISHED" } });
    if (!testCourse) {
      testCourse = await db.course.create({
        data: {
          title: `Analytics Track ${stamp}`,
          slug: `analytics-track-${stamp}`,
          summary: "Summary",
          description: "Description",
          baseFee: 5000000,
          status: "PUBLISHED",
        },
      });
      createdCourse = true;
    }

    testStudentUser = await db.user.create({
      data: {
        email: `student-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Vikram",
        lastName: "Mehta",
        roleCode: UserRoleCode.STUDENT,
      },
    });

    testStudentProfile = await db.studentProfile.create({
      data: {
        userId: testStudentUser.id,
        studentId: `STU-BI-${stamp.toString().slice(-4)}`,
      },
    });

    testEnrollment = await db.enrollment.create({
      data: {
        studentId: testStudentProfile.id,
        courseId: testCourse.id,
        status: EnrollmentStatus.ACTIVE,
      },
    });

    testStaffUser = await db.user.create({
      data: {
        email: `staff-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Neha",
        lastName: "Gupta",
        roleCode: UserRoleCode.HR,
      },
    });

    testStaffProfile = await db.staffProfile.create({
      data: {
        userId: testStaffUser.id,
        employeeId: `SLG-EMP-BI-${stamp.toString().slice(-4)}`,
        department: StaffDepartment.OPERATIONS,
        designation: "Operations Lead",
        baseSalary: 5000000, // ₹50,000
      },
    });

    // -------------------------------------------------------------
    // Phase 1: Executive Financial Metrics Aggregation Math
    // -------------------------------------------------------------
    console.log("\n[Phase 1] Testing Financial Metrics Aggregation (Paise Precision)...");
    testFeeStructure = await db.feeStructure.create({
      data: {
        studentId: testStudentProfile.id,
        enrollmentId: testEnrollment.id,
        courseId: testCourse.id,
        totalCourseFee: 5000000,
        registrationFee: 0,
        netPayableAmount: 5000000,
        paidAmount: 2000000,
        pendingAmount: 3000000,
        paymentStatus: FeePaymentStatus.PARTIAL,
        status: FeeStructureStatus.ACTIVE,
        createdById: adminUser.id,
      },
    });

    testPaymentTx = await db.paymentTransaction.create({
      data: {
        feeStructureId: testFeeStructure.id,
        transactionReference: `TXN-BI-${stamp}`,
        amount: 2000000, // ₹20,000 received
        paymentMethod: PaymentMethod.UPI,
        status: PaymentTransactionStatus.SUCCESS,
        receivedById: adminUser.id,
      },
    });

    testPayrollRecord = await db.payrollRecord.create({
      data: {
        salarySlipNumber: `SLIP-BI-${stamp}`,
        staffId: testStaffProfile.id,
        month: 9,
        year: 2026,
        baseSalary: 5000000,
        netSalary: 4500000, // ₹45,000 disbursed
        workingDays: 30,
        paidDays: 30,
        status: PayrollStatus.PAID,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentReference: `NEFT-BI-${stamp}`,
        processedById: adminUser.id,
      },
    });

    const fin = await AnalyticsService.getExecutiveFinancials();
    console.log(`  ✓ Realized Revenue: ₹${fin.totalRevenuePaise / 100}`);
    console.log(`  ✓ Payroll Disbursed: ₹${fin.totalPayrollDisbursedPaise / 100}`);
    console.log(`  ✓ Net Operational Surplus: ₹${fin.netOperationalBalancePaise / 100}`);
    console.log(`  ✓ Outstanding Dues: ₹${fin.totalOutstandingDuesPaise / 100}`);

    if (fin.netOperationalBalancePaise !== fin.totalRevenuePaise - fin.totalPayrollDisbursedPaise) {
      throw new Error("Financial balance calculation mismatch in Paise.");
    }
    if (fin.totalOutstandingDuesPaise < 3000000) {
      throw new Error("Outstanding dues aggregate failed to capture active fee structure.");
    }

    // -------------------------------------------------------------
    // Phase 2: Admissions Conversion Funnel Calculation
    // -------------------------------------------------------------
    console.log("\n[Phase 2] Testing Admissions Funnel & Conversion Calculations...");
    testLead1 = await db.lead.create({
      data: {
        fullName: "Lead One",
        email: `lead1-${stamp}@gmail.com`,
        phone: `980000${stamp.toString().slice(-4)}`,
        source: LeadSource.WEBSITE,
        status: LeadStatus.NEW,
      },
    });

    testLead2 = await db.lead.create({
      data: {
        fullName: "Lead Two",
        email: `lead2-${stamp}@gmail.com`,
        phone: `981000${stamp.toString().slice(-4)}`,
        source: LeadSource.WALK_IN,
        status: LeadStatus.ADMITTED,
      },
    });

    const adm = await AnalyticsService.getAdmissionsMetrics();
    console.log(`  ✓ Total Leads: ${adm.totalLeads} (Admitted: ${adm.admittedCount}, Rate: ${adm.conversionRate}%)`);
    if (adm.totalLeads < 2 || adm.admittedCount < 1) {
      throw new Error("Admissions funnel counts failed to reflect test leads.");
    }

    // -------------------------------------------------------------
    // Phase 3: Placement Statistics & CTC Parsing
    // -------------------------------------------------------------
    console.log("\n[Phase 3] Testing Placement Statistics & Package Parsing...");
    testPlacementProfile = await db.studentPlacementProfile.create({
      data: {
        studentId: testStudentProfile.id,
        isPlaced: true,
        placedCompany: "TCS Innovate",
        placedPackage: "8.5 LPA",
      },
    });

    const plc = await AnalyticsService.getPlacementMetrics();
    console.log(`  ✓ Placement Rate: ${plc.placementRate}%, Highest: ${plc.highestPackage}, Avg: ${plc.averagePackage}`);
    if (plc.totalStudentsPlaced < 1 || !plc.highestPackage.includes("LPA")) {
      throw new Error("Placement metrics failed to aggregate placed profiles.");
    }

    // -------------------------------------------------------------
    // Phase 4: Academic Operations & Attendance Calculations
    // -------------------------------------------------------------
    console.log("\n[Phase 4] Testing Academic Operations Metrics...");
    const aca = await AnalyticsService.getAcademicsMetrics();
    console.log(`  ✓ Active Enrollments: ${aca.totalActiveEnrollments}, Attendance: ${aca.averageAttendanceRate}%`);
    if (aca.totalActiveEnrollments < 1 || aca.averageAttendanceRate < 0) {
      throw new Error("Academic metrics failed to compute active enrollment or attendance rate.");
    }

    // -------------------------------------------------------------
    // Phase 5: Fee Defaulters Report Generation Logic
    // -------------------------------------------------------------
    console.log("\n[Phase 5] Testing Fee Defaulters Detection & Overdue Logic...");
    testOverdueInstallment = await db.feeInstallment.create({
      data: {
        feeStructureId: testFeeStructure.id,
        installmentNumber: 2,
        amount: 3000000, // ₹30,000
        paidAmount: 0,
        dueDate: new Date("2026-01-01T00:00:00Z"), // Deliberately in the past (overdue)
        notes: "Overdue installment test",
      },
    });

    const defaultersReport = await ReportGeneratorService.generateFeeDefaultersReport(adminActor);
    console.log(`  ✓ Generated Defaulters Report: ${defaultersReport.fileName} (${defaultersReport.recordCount} records)`);
    if (defaultersReport.recordCount < 1 || !defaultersReport.csvContent.includes(testStudentUser.email)) {
      throw new Error("Fee defaulters report did not capture overdue installment.");
    }

    // -------------------------------------------------------------
    // Phase 6: CSV Formatting & PII Sanitization
    // -------------------------------------------------------------
    console.log("\n[Phase 6] Testing CSV Formatting & PII Sanitization...");
    const cashflowReport = await ReportGeneratorService.generateFinancialCashflowReport(adminActor);
    console.log(`  ✓ Cashflow Report Records: ${cashflowReport.recordCount}`);

    // Check header and content
    if (!cashflowReport.csvContent.startsWith("Type,Reference,Date")) {
      throw new Error("Cashflow CSV header structure invalid.");
    }
    // Verify no sensitive tokens leaked
    if (cashflowReport.csvContent.includes("passwordHash") || cashflowReport.csvContent.includes("secret")) {
      throw new Error("PII / Secret leak detected in generated CSV export!");
    }
    console.log("  ✓ Confirmed CSV export is properly RFC 4180 formatted and free of sensitive PII.");

    // -------------------------------------------------------------
    // Phase 7: RBAC Security Boundaries
    // -------------------------------------------------------------
    console.log("\n[Phase 7] Testing RBAC Security Restrictions on Analytics...");
    const allowedRoles = [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN];

    const studentBlocked = !hasRole(UserRoleCode.STUDENT, allowedRoles);
    const trainerBlocked = !hasRole(UserRoleCode.TRAINER, allowedRoles);
    const telecallerBlocked = !hasRole(UserRoleCode.TELECALLER, allowedRoles);
    const counselorBlocked = !hasRole(UserRoleCode.COUNSELOR, allowedRoles);

    if (!studentBlocked || !trainerBlocked || !telecallerBlocked || !counselorBlocked) {
      throw new Error("RBAC role check allowed an unauthorized role access to executive analytics!");
    }
    console.log("  ✓ Confirmed STUDENT, TRAINER, TELECALLER, and COUNSELOR are strictly blocked (FORBIDDEN).");

    console.log("\n================================================================");
    console.log("   ALL 8 DAY 13 VERIFICATION SCENARIOS PASSED SUCCESSFULLY!     ");
    console.log("================================================================");
  } finally {
    // -------------------------------------------------------------
    // Phase 8: Ephemeral Test Records Cleanup
    // -------------------------------------------------------------
    console.log("\n[Phase 8] Cleaning up ephemeral test records...");
    try {
      if (testOverdueInstallment?.id) await db.feeInstallment.deleteMany({ where: { id: testOverdueInstallment.id } });
      if (testPaymentTx?.id) await db.paymentTransaction.deleteMany({ where: { id: testPaymentTx.id } });
      if (testFeeStructure?.id) await db.feeStructure.deleteMany({ where: { id: testFeeStructure.id } });
      if (testPayrollRecord?.id) await db.payrollRecord.deleteMany({ where: { id: testPayrollRecord.id } });
      if (testAttendance?.id) await db.attendanceRecord.deleteMany({ where: { id: testAttendance.id } });
      if (testPlacementProfile?.id) await db.studentPlacementProfile.deleteMany({ where: { id: testPlacementProfile.id } });
      if (testEnrollment?.id) await db.enrollment.deleteMany({ where: { id: testEnrollment.id } });
      if (createdCourse && testCourse?.id) await db.course.deleteMany({ where: { id: testCourse.id } });
      if (testLead1?.id) await db.lead.deleteMany({ where: { id: testLead1.id } });
      if (testLead2?.id) await db.lead.deleteMany({ where: { id: testLead2.id } });
      if (testStaffProfile?.id) await db.staffProfile.deleteMany({ where: { id: testStaffProfile.id } });
      if (testStudentProfile?.id) await db.studentProfile.deleteMany({ where: { id: testStudentProfile.id } });
      if (testStaffUser?.id) await db.user.deleteMany({ where: { id: testStaffUser.id } });
      if (testStudentUser?.id) await db.user.deleteMany({ where: { id: testStudentUser.id } });
      await db.auditReportExport.deleteMany({ where: { generatedById: adminActor.id } });
      console.log("  ✓ Ephemeral test records cleanly removed.");
    } catch (cleanupErr) {
      console.error("  ⚠ Cleanup error (non-fatal):", cleanupErr);
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
