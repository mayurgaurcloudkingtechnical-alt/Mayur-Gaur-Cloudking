/**
 * Day 8 Automated Verification Suite: Finance, Fees, Billing & Offline Payments
 */

import { db } from "../src/server/db/client";
import { FeeStructureService } from "../src/server/services/fee-structure.service";
import { FeeInstallmentService } from "../src/server/services/fee-installment.service";
import { PaymentService } from "../src/server/services/payment.service";
import {
  UserRoleCode,
  FeePaymentStatus,
  InstallmentStatus,
  PaymentMethod,
  PaymentTransactionStatus,
  EnrollmentStatus,
} from "@prisma/client";
import { AuthenticatedUser } from "../src/server/auth/rbac";
import * as bcrypt from "bcryptjs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runVerification() {
  console.log("===============================================================");
  console.log("  SOFTLAB GLOBAL — DAY 8 FINANCE & BILLING VERIFICATION SUITE");
  console.log("===============================================================\n");

  const course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!course) throw new Error("A published course is required for testing.");

  // Create temporary test users
  const dummyHash = await bcrypt.hash("TestPass123!", 10);

  const testAccountantUser = await db.user.create({
    data: {
      email: "temp.accountant@softlabglobal.com",
      firstName: "Finance",
      lastName: "Tester",
      roleCode: UserRoleCode.ACCOUNTANT,
      passwordHash: dummyHash,
    },
  });

  const testTrainerUser = await db.user.create({
    data: {
      email: "temp.trainer@softlabglobal.com",
      firstName: "Faculty",
      lastName: "Tester",
      roleCode: UserRoleCode.TRAINER,
      passwordHash: dummyHash,
    },
  });

  const testStudentUser1 = await db.user.create({
    data: {
      email: "temp.student1@softlabglobal.com",
      firstName: "Student",
      lastName: "Alpha",
      roleCode: UserRoleCode.STUDENT,
      passwordHash: dummyHash,
    },
  });

  const testStudentProfile1 = await db.studentProfile.create({
    data: {
      userId: testStudentUser1.id,
      studentId: "SLG-TEST-0001",
    },
  });

  const testStudentUser2 = await db.user.create({
    data: {
      email: "temp.student2@softlabglobal.com",
      firstName: "Student",
      lastName: "Beta",
      roleCode: UserRoleCode.STUDENT,
      passwordHash: dummyHash,
    },
  });

  const testStudentProfile2 = await db.studentProfile.create({
    data: {
      userId: testStudentUser2.id,
      studentId: "SLG-TEST-0002",
    },
  });

  const testEnrollment1 = await db.enrollment.create({
    data: {
      studentId: testStudentProfile1.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const testEnrollment2 = await db.enrollment.create({
    data: {
      studentId: testStudentProfile2.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const accountantAuth: AuthenticatedUser = {
    id: testAccountantUser.id,
    email: testAccountantUser.email,
    roleCode: UserRoleCode.ACCOUNTANT,
    permissions: ["payments:record_offline", "payments:view_ledger", "admissions:read"],
    firstName: "Finance",
    lastName: "Tester",
  };

  const trainerAuth: AuthenticatedUser = {
    id: testTrainerUser.id,
    email: testTrainerUser.email,
    roleCode: UserRoleCode.TRAINER,
    permissions: ["attendance:mark", "courses:read"],
    firstName: "Faculty",
    lastName: "Tester",
  };

  const student1Auth: AuthenticatedUser = {
    id: testStudentUser1.id,
    email: testStudentUser1.email,
    roleCode: UserRoleCode.STUDENT,
    permissions: ["courses:read"],
    firstName: "Student",
    lastName: "Alpha",
  };

  try {
    // 1. Math calculation & Non-Negative check
    console.log("--- 1. Testing Financial Calculation Engine (Integer Paise) ---");
    const calc1 = FeeStructureService.calculateNetPayable({
      totalCourseFee: 5000000, // ₹50,000
      registrationFee: 100000, // ₹1,000
      discountAmount: 500000,  // ₹5,000
      scholarshipAmount: 200000, // ₹2,000
    });
    assert(calc1.isValid === true, "Valid calculation passes validation");
    assert(calc1.netPayable === 4400000, "Net payable correctly calculated as ₹44,000 (4400000 Paise)");

    const calcNegative = FeeStructureService.calculateNetPayable({
      totalCourseFee: 5000000,
      registrationFee: 0,
      discountAmount: 6000000, // Exceeds fee!
      scholarshipAmount: 0,
    });
    assert(calcNegative.isValid === false, "Negative net payable correctly rejected as invalid");

    // 2. RBAC Access Control on Fee Structure Creation
    console.log("\n--- 2. Testing RBAC Permission Boundaries ---");
    let trainerBlocked = false;
    try {
      await FeeStructureService.createFeeStructure(trainerAuth, {
        enrollmentId: testEnrollment1.id,
        discountAmount: 100000,
      });
    } catch (err: any) {
      if (err.code === "FORBIDDEN") trainerBlocked = true;
    }
    assert(trainerBlocked, "Trainer blocked from creating student fee structure (FORBIDDEN)");

    // 3. Fee Structure Creation by Accountant with Installment Validation
    console.log("\n--- 3. Testing Fee Structure Creation with Installment Plan ---");
    const courseFee = course.baseFee; // e.g. 5000000
    const discount = 1000000; // ₹10,000 discount
    const net = courseFee - discount; // 4000000 (₹40,000)

    // Attempt creation with mismatched installment sum
    let mismatchBlocked = false;
    try {
      await FeeStructureService.createFeeStructure(accountantAuth, {
        enrollmentId: testEnrollment1.id,
        discountAmount: discount,
        installments: [
          { amount: 2000000, dueDate: new Date(Date.now() + 7 * 86400000) },
          { amount: 1500000, dueDate: new Date(Date.now() + 21 * 86400000) }, // Sum = 3500000 != 4000000
        ],
      });
    } catch (err: any) {
      if (err.code === "BAD_REQUEST") mismatchBlocked = true;
    }
    assert(mismatchBlocked, "Mismatched installment total correctly rejected with BAD_REQUEST");

    // Valid fee structure creation with 2 installments
    const fee1 = await FeeStructureService.createFeeStructure(accountantAuth, {
      enrollmentId: testEnrollment1.id,
      discountAmount: discount,
      remarks: "Early bird admission concession",
      installments: [
        { amount: 2000000, dueDate: new Date(Date.now() - 3 * 86400000), notes: "Registration milestone" }, // Due 3 days ago (overdue)
        { amount: 2000000, dueDate: new Date(Date.now() + 14 * 86400000), notes: "Second milestone" },
      ],
    });

    assert(!!fee1, "Fee structure successfully created in PostgreSQL");
    assert(fee1!.netPayableAmount === net, `Net payable amount recorded as ${net} Paise`);
    assert(fee1!.pendingAmount === net, `Pending amount equals net payable (${net} Paise)`);
    assert(fee1!.paymentStatus === FeePaymentStatus.PENDING, "Initial status set to PENDING");
    assert(fee1!.installments.length === 2, "2 installments generated linked to fee structure");

    // 4. Overdue Installment Detection
    console.log("\n--- 4. Testing Overdue Milestone Detection ---");
    const instList = await FeeInstallmentService.listInstallments(accountantAuth, fee1!.id);
    assert(instList.length === 2, "Retrieved 2 installments");
    assert(instList[0].isOverdue === true, "First installment (past due date) correctly marked isOverdue=true");
    assert(instList[1].isOverdue === false, "Second installment (future due date) marked isOverdue=false");

    // 5. Overpayment Prevention
    console.log("\n--- 5. Testing Overpayment Rejection ---");
    let overpaymentBlocked = false;
    try {
      await PaymentService.recordOfflinePayment(accountantAuth, {
        feeStructureId: fee1!.id,
        amount: net + 500000, // ₹5,000 more than outstanding!
        paymentMethod: PaymentMethod.UPI,
      });
    } catch (err: any) {
      if (err.code === "BAD_REQUEST") overpaymentBlocked = true;
    }
    assert(overpaymentBlocked, "Payment exceeding pending balance correctly rejected with BAD_REQUEST");

    // 6. Partial Payment Recording & Status Transition
    console.log("\n--- 6. Testing Partial Payment Recording ---");
    const partialPaymentResult = await PaymentService.recordOfflinePayment(accountantAuth, {
      feeStructureId: fee1!.id,
      installmentId: instList[0].id,
      amount: 2000000, // ₹20,000
      paymentMethod: PaymentMethod.UPI,
      providerReference: "UPI-TEST-12345",
      remarks: "Candidate paid via PhonePe QR",
    });

    assert(partialPaymentResult.payment.status === PaymentTransactionStatus.SUCCESS, "Payment recorded as SUCCESS");
    assert(partialPaymentResult.feeStructure.paidAmount === 2000000, "Fee structure paidAmount updated to 2000000 Paise");
    assert(partialPaymentResult.feeStructure.pendingAmount === 2000000, "Pending amount reduced to 2000000 Paise");
    assert(
      partialPaymentResult.feeStructure.paymentStatus === FeePaymentStatus.PARTIAL,
      "Fee structure status transitioned to PARTIAL"
    );

    // Verify first installment is marked PAID
    const instListAfter = await FeeInstallmentService.listInstallments(accountantAuth, fee1!.id);
    assert(instListAfter[0].status === InstallmentStatus.PAID, "Installment #1 status transitioned to PAID");
    assert(instListAfter[0].paidAmount === 2000000, "Installment #1 paidAmount updated to 2000000");

    // 7. Full Settlement Payment
    console.log("\n--- 7. Testing Final Settlement Payment ---");
    const finalPaymentResult = await PaymentService.recordOfflinePayment(accountantAuth, {
      feeStructureId: fee1!.id,
      installmentId: instList[1].id,
      amount: 2000000, // Final ₹20,000
      paymentMethod: PaymentMethod.CASH,
      providerReference: "CASH-REC-001",
    });

    assert(finalPaymentResult.feeStructure.paidAmount === 4000000, "Total paid equals net payable (4000000 Paise)");
    assert(finalPaymentResult.feeStructure.pendingAmount === 0, "Pending balance cleared to 0 Paise");
    assert(
      finalPaymentResult.feeStructure.paymentStatus === FeePaymentStatus.PAID,
      "Fee structure status successfully transitioned to PAID"
    );

    // 8. Student Isolation (Student 1 cannot query Student 2 fees)
    console.log("\n--- 8. Testing Student Cross-Tenant Access Isolation ---");
    const fee2 = await FeeStructureService.createFeeStructure(accountantAuth, {
      enrollmentId: testEnrollment2.id,
      discountAmount: 500000,
    });
    assert(!!fee2, "Second student fee structure created");

    let studentCrossBlocked = false;
    try {
      await FeeStructureService.getByEnrollment(student1Auth, testEnrollment2.id);
    } catch (err: any) {
      if (err.code === "FORBIDDEN") studentCrossBlocked = true;
    }
    assert(studentCrossBlocked, "Student 1 blocked from accessing Student 2 fee structure (FORBIDDEN)");

    // 9. Institutional Metrics Aggregation
    console.log("\n--- 9. Testing Finance Metrics Aggregator ---");
    const metrics = await FeeStructureService.getOverviewMetrics(accountantAuth);
    assert(metrics.totalReceivable > 0, "Total receivable metric aggregated successfully");
    assert(metrics.totalCollected >= 4000000, "Total collected includes tested transactions");

    // 10. Audit Log Verification
    console.log("\n--- 10. Testing Audit Trail for Financial Mutations ---");
    const auditLogs = await db.auditLog.findMany({
      where: {
        action: { in: ["FEE_STRUCTURE_CREATED", "PAYMENT_RECORDED"] },
      },
    });
    assert(auditLogs.length >= 3, "Audit logs verified for fee creation and payment mutations");
    console.log(`✓ Verified ${auditLogs.length} financial audit entries`);

  } finally {
    // 11. Cleanup of Ephemeral Test Data
    console.log("\n--- 11. Cleaning Up Ephemeral Test Data ---");
    await db.paymentTransaction.deleteMany({
      where: { studentId: { in: [testStudentProfile1.id, testStudentProfile2.id] } },
    });
    await db.feeInstallment.deleteMany({
      where: { feeStructure: { studentId: { in: [testStudentProfile1.id, testStudentProfile2.id] } } },
    });
    await db.feeStructure.deleteMany({
      where: { studentId: { in: [testStudentProfile1.id, testStudentProfile2.id] } },
    });
    await db.enrollment.deleteMany({
      where: { id: { in: [testEnrollment1.id, testEnrollment2.id] } },
    });
    await db.studentProfile.deleteMany({
      where: { id: { in: [testStudentProfile1.id, testStudentProfile2.id] } },
    });
    await db.user.deleteMany({
      where: {
        id: {
          in: [testAccountantUser.id, testTrainerUser.id, testStudentUser1.id, testStudentUser2.id],
        },
      },
    });
    console.log("✓ Ephemeral test records cleaned up cleanly.");
  }

  console.log("\n===============================================================");
  console.log("  ALL DAY 8 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
  console.log("===============================================================\n");
}

runVerification()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
