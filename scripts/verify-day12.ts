import { db } from "../src/server/db/client";
import { StaffProfileService } from "../src/server/services/staff-profile.service";
import { LeaveManagementService } from "../src/server/services/leave-management.service";
import { PayrollService } from "../src/server/services/payroll.service";
import { AuthenticatedUser } from "../src/server/auth/rbac";
import {
  UserRoleCode,
  StaffDepartment,
  LeaveType,
  LeaveRequestStatus,
  PayrollStatus,
  PaymentMethod,
} from "@prisma/client";

async function main() {
  console.log("================================================================");
  console.log("   DAY 12 VERIFICATION: STAFF ERP, HRMS & PAYROLL ENGINE       ");
  console.log("================================================================");

  // Setup Admin Actor
  let adminUser = await db.user.findFirst({
    where: { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN] } },
  });
  if (!adminUser) {
    adminUser = await db.user.create({
      data: {
        email: `hr-admin-${Date.now()}@softlabglobal.com`,
        passwordHash: "dummy-hash",
        firstName: "HR",
        lastName: "Administrator",
        roleCode: UserRoleCode.ADMIN,
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

  // Test Entities
  const stamp = Date.now();
  let user1: any, user2: any, studentUser: any;
  let staff1: any, staff2: any;
  let leave1: any, leave2: any, unpaidLeave: any;
  let payrollRecord1: any;

  try {
    // -------------------------------------------------------------
    // Phase 1: Staff Profile Creation & Employee ID Uniqueness
    // -------------------------------------------------------------
    console.log("\n[Phase 1] Testing Staff Profile Creation & Employee ID Uniqueness...");
    user1 = await db.user.create({
      data: {
        email: `staff1-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Arun",
        lastName: "Sharma",
        roleCode: UserRoleCode.TRAINER,
      },
    });

    user2 = await db.user.create({
      data: {
        email: `staff2-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Pooja",
        lastName: "Nair",
        roleCode: UserRoleCode.COUNSELOR,
      },
    });

    const empId1 = `SLG-EMP-T${stamp.toString().slice(-4)}`;
    staff1 = await StaffProfileService.createStaffProfile(adminActor, {
      userId: user1.id,
      employeeId: empId1,
      department: StaffDepartment.ACADEMICS,
      designation: "Senior Lead Trainer",
      baseSalary: 6000000, // ₹60,000 in Paise
      bankAccountNumber: "987654321000",
      bankIfsc: "HDFC0001234",
    });

    console.log(`  ✓ Staff profile created: ${staff1.employeeId} (Base: ₹${staff1.baseSalary / 100})`);

    // Duplicate employee ID test
    let duplicateRejected = false;
    try {
      await StaffProfileService.createStaffProfile(adminActor, {
        userId: user2.id,
        employeeId: empId1, // deliberate duplicate
        department: StaffDepartment.ADMISSIONS,
        designation: "Senior Admissions Counselor",
        baseSalary: 4500000,
      });
    } catch (err: any) {
      if (err.code === "CONFLICT") duplicateRejected = true;
    }
    if (!duplicateRejected) throw new Error("Duplicate employee ID was unexpectedly allowed!");
    console.log("  ✓ Duplicate employee ID properly rejected with CONFLICT error.");

    // Create staff2 with unique employeeId
    const empId2 = `SLG-EMP-T${(stamp + 1).toString().slice(-4)}`;
    staff2 = await StaffProfileService.createStaffProfile(adminActor, {
      userId: user2.id,
      employeeId: empId2,
      department: StaffDepartment.ADMISSIONS,
      designation: "Senior Admissions Counselor",
      baseSalary: 4500000,
    });
    console.log(`  ✓ Staff profile 2 created: ${staff2.employeeId}`);

    // -------------------------------------------------------------
    // Phase 2: Leave Request Creation & Date Validation
    // -------------------------------------------------------------
    console.log("\n[Phase 2] Testing Leave Request Creation & Date Validation...");
    let invalidDateRejected = false;
    try {
      await LeaveManagementService.applyForLeave(staff1.id, {
        leaveType: LeaveType.CASUAL,
        startDate: new Date("2026-10-15"),
        endDate: new Date("2026-10-10"), // invalid: start > end
        reason: "Vacation",
      });
    } catch (err: any) {
      if (err.code === "BAD_REQUEST") invalidDateRejected = true;
    }
    if (!invalidDateRejected) throw new Error("Invalid start/end date was unexpectedly allowed!");
    console.log("  ✓ Inverted date range (start > end) properly rejected with BAD_REQUEST.");

    // Valid leave creation
    leave1 = await LeaveManagementService.applyForLeave(staff1.id, {
      leaveType: LeaveType.CASUAL,
      startDate: new Date("2026-10-05T00:00:00Z"),
      endDate: new Date("2026-10-07T00:00:00Z"),
      reason: "Family event",
    });
    console.log(`  ✓ Valid leave created: ID ${leave1.id} (Days: ${leave1.daysCount}, Status: ${leave1.status})`);

    // -------------------------------------------------------------
    // Phase 3: Overlapping Leave Request Rejection
    // -------------------------------------------------------------
    console.log("\n[Phase 3] Testing Overlapping Leave Request Rejection...");
    let overlapRejected = false;
    try {
      await LeaveManagementService.applyForLeave(staff1.id, {
        leaveType: LeaveType.SICK,
        startDate: new Date("2026-10-06T00:00:00Z"), // overlaps leave1 (Oct 5 to Oct 7)
        endDate: new Date("2026-10-08T00:00:00Z"),
        reason: "Dental appointment",
      });
    } catch (err: any) {
      if (err.code === "CONFLICT") overlapRejected = true;
    }
    if (!overlapRejected) throw new Error("Overlapping leave request was unexpectedly allowed!");
    console.log("  ✓ Overlapping leave request properly rejected with CONFLICT error.");

    // -------------------------------------------------------------
    // Phase 4: Leave Approval & Rejection Workflow with Audit Trail
    // -------------------------------------------------------------
    console.log("\n[Phase 4] Testing Leave Review Workflow...");
    const approvedLeave = await LeaveManagementService.reviewLeaveRequest(adminActor, leave1.id, {
      status: LeaveRequestStatus.APPROVED,
    });
    if (approvedLeave.status !== LeaveRequestStatus.APPROVED || approvedLeave.reviewedById !== adminActor.id) {
      throw new Error("Leave approval state was not correctly saved.");
    }
    console.log(`  ✓ Leave ${leave1.id} approved by ${adminActor.email}.`);

    // Apply for non-overlapping leave and reject it
    leave2 = await LeaveManagementService.applyForLeave(staff1.id, {
      leaveType: LeaveType.EARNED,
      startDate: new Date("2026-10-20T00:00:00Z"),
      endDate: new Date("2026-10-22T00:00:00Z"),
      reason: "Personal trip",
    });
    const rejectedLeave = await LeaveManagementService.reviewLeaveRequest(adminActor, leave2.id, {
      status: LeaveRequestStatus.REJECTED,
      rejectionReason: "Exam schedule conflict",
    });
    if (rejectedLeave.status !== LeaveRequestStatus.REJECTED || rejectedLeave.rejectionReason !== "Exam schedule conflict") {
      throw new Error("Leave rejection state was not correctly saved.");
    }
    console.log(`  ✓ Leave ${leave2.id} rejected with reason: '${rejectedLeave.rejectionReason}'.`);

    // -------------------------------------------------------------
    // Phase 5: Deterministic Payroll Math in Integer Paise
    // -------------------------------------------------------------
    console.log("\n[Phase 5] Testing Deterministic Payroll Math with Unpaid Leave Deductions...");
    // Create 3 days UNPAID leave in Sep 2026
    unpaidLeave = await LeaveManagementService.applyForLeave(staff1.id, {
      leaveType: LeaveType.UNPAID,
      startDate: new Date("2026-09-10T00:00:00Z"),
      endDate: new Date("2026-09-12T00:00:00Z"),
      reason: "Unpaid personal leave",
    });
    await LeaveManagementService.reviewLeaveRequest(adminActor, unpaidLeave.id, {
      status: LeaveRequestStatus.APPROVED,
    });

    const unpaidDays = await LeaveManagementService.getApprovedUnpaidLeaveDays(staff1.id, 9, 2026);
    console.log(`  ✓ Approved unpaid leave days for 09/2026: ${unpaidDays}`);
    if (unpaidDays !== 3) throw new Error(`Expected 3 unpaid leave days, found ${unpaidDays}`);

    const math = PayrollService.calculateSalaryComponents({
      baseSalary: 6000000, // ₹60,000
      workingDays: 30,
      unpaidLeaveDays: 3,
      allowances: 500000,  // ₹5,000
      deductions: 200000,  // ₹2,000
    });

    // perDaySalary = 6000000 / 30 = 200000
    // leaveDeductions = 3 * 200000 = 600000
    // netSalary = 6000000 + 500000 - 200000 - 600000 = 5700000
    if (math.perDaySalary !== 200000) throw new Error(`Invalid perDaySalary: ${math.perDaySalary}`);
    if (math.leaveDeductions !== 600000) throw new Error(`Invalid leaveDeductions: ${math.leaveDeductions}`);
    if (math.netSalary !== 5700000) throw new Error(`Invalid netSalary: ${math.netSalary}`);
    console.log(`  ✓ Math verified: Base ₹60,000 - LeaveDed ₹6,000 + Allow ₹5,000 - Ded ₹2,000 = Net ₹${math.netSalary / 100}`);

    // -------------------------------------------------------------
    // Phase 6: Salary Slip Reference & Generation
    // -------------------------------------------------------------
    console.log("\n[Phase 6] Testing Payroll Generation & Collision-Safe Reference...");
    payrollRecord1 = await PayrollService.generateStaffPayroll(adminActor, {
      staffId: staff1.id,
      month: 9,
      year: 2026,
      workingDays: 30,
      allowances: 500000,
      deductions: 200000,
      remarks: "Regular monthly payroll",
    });

    if (!payrollRecord1.salarySlipNumber.startsWith("SLIP-202609-")) {
      throw new Error(`Invalid salary slip reference format: ${payrollRecord1.salarySlipNumber}`);
    }
    if (payrollRecord1.netSalary !== 5700000) {
      throw new Error(`Unexpected net salary persisted: ${payrollRecord1.netSalary}`);
    }
    console.log(`  ✓ Payroll generated: ${payrollRecord1.salarySlipNumber} (Net: ₹${payrollRecord1.netSalary / 100})`);

    // -------------------------------------------------------------
    // Phase 7: Duplicate Payroll Prevention (@@unique([staffId, month, year]))
    // -------------------------------------------------------------
    console.log("\n[Phase 7] Testing Duplicate Payroll Prevention...");
    let duplicatePayrollRejected = false;
    try {
      await PayrollService.generateStaffPayroll(adminActor, {
        staffId: staff1.id,
        month: 9,
        year: 2026,
      });
    } catch (err: any) {
      if (err.code === "CONFLICT") duplicatePayrollRejected = true;
    }
    if (!duplicatePayrollRejected) throw new Error("Duplicate monthly payroll was unexpectedly allowed!");
    console.log("  ✓ Duplicate monthly payroll properly rejected with CONFLICT error.");

    // -------------------------------------------------------------
    // Phase 8: Disburse & Mark Payroll as PAID
    // -------------------------------------------------------------
    console.log("\n[Phase 8] Testing Disbursal & Status Transition to PAID...");
    const paidRecord = await PayrollService.markPayrollPaid(adminActor, payrollRecord1.id, {
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      paymentReference: "NEFT-20260930-SLG9988",
    });
    if (paidRecord.status !== PayrollStatus.PAID || paidRecord.paymentReference !== "NEFT-20260930-SLG9988") {
      throw new Error("Payroll status transition to PAID failed.");
    }
    console.log(`  ✓ Payroll marked PAID with reference: ${paidRecord.paymentReference}`);

    // -------------------------------------------------------------
    // Phase 9: Cross-Staff Privacy Isolation
    // -------------------------------------------------------------
    console.log("\n[Phase 9] Testing Cross-Staff Privacy Isolation...");
    let privacyBlocked = false;
    try {
      // Staff 2 attempting to view Staff 1's salary slip
      await PayrollService.getSalarySlipForStaff(staff2.id, payrollRecord1.id);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") privacyBlocked = true;
    }
    if (!privacyBlocked) throw new Error("Staff 2 was unexpectedly allowed to view Staff 1's salary slip!");
    console.log("  ✓ Cross-staff salary slip access properly blocked with FORBIDDEN error.");

    // -------------------------------------------------------------
    // Phase 10: Student Role Access Guard
    // -------------------------------------------------------------
    console.log("\n[Phase 10] Testing Student Role Protection...");
    studentUser = await db.user.create({
      data: {
        email: `student-${stamp}@softlabglobal.com`,
        passwordHash: "hash123",
        firstName: "Rohan",
        lastName: "Verma",
        roleCode: UserRoleCode.STUDENT,
      },
    });

    const studentProfile = await StaffProfileService.getStaffProfileByUserId(studentUser.id);
    if (studentProfile !== null) {
      throw new Error("Student unexpectedly has a staff profile!");
    }
    console.log("  ✓ Confirmed student has no staff profile; self-service procedures return null / blocked.");

    console.log("\n================================================================");
    console.log("   ALL 10 DAY 12 VERIFICATION SCENARIOS PASSED SUCCESSFULLY!    ");
    console.log("================================================================");
  } finally {
    // -------------------------------------------------------------
    // Phase 11: Ephemeral Test Records Cleanup
    // -------------------------------------------------------------
    console.log("\n[Phase 11] Cleaning up ephemeral test records...");
    try {
      if (payrollRecord1?.id) await db.payrollRecord.deleteMany({ where: { staffId: staff1.id } });
      if (staff1?.id) await db.leaveRequest.deleteMany({ where: { staffId: staff1.id } });
      if (staff2?.id) await db.leaveRequest.deleteMany({ where: { staffId: staff2.id } });
      if (staff1?.id) await db.staffProfile.deleteMany({ where: { id: staff1.id } });
      if (staff2?.id) await db.staffProfile.deleteMany({ where: { id: staff2.id } });
      if (user1?.id) await db.user.deleteMany({ where: { id: user1.id } });
      if (user2?.id) await db.user.deleteMany({ where: { id: user2.id } });
      if (studentUser?.id) await db.user.deleteMany({ where: { id: studentUser.id } });
      console.log("  ✓ Cleanup completed cleanly.");
    } catch (e) {
      console.error("  ⚠ Cleanup error (non-fatal):", e);
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
