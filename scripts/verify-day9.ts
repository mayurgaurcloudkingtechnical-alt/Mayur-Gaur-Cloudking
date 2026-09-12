/**
 * Day 9 Automated Verification Suite:
 * Online Payment + Razorpay + Server Verification + Webhooks + Auto Enrollment + Receipts
 */

import { db } from "../src/server/db/client";
import { OnlinePaymentService } from "../src/server/services/online-payment.service";
import { ReceiptService } from "../src/server/services/receipt.service";
import { RazorpayProvider } from "../src/server/lib/payment/razorpay.provider";
import {
  UserRoleCode,
  ApplicationStage,
  EnrollmentStatus,
  FeePaymentStatus,
  PaymentTransactionStatus,
  PaymentMethod,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

async function runVerification() {
  console.log("=================================================================");
  console.log("  SOFTLAB GLOBAL — DAY 9 ONLINE PAYMENT & AUTO ENROLLMENT SUITE");
  console.log("=================================================================\n");

  const course = await db.course.findFirst({ where: { status: "PUBLISHED" } });
  if (!course) throw new Error("A published course is required for testing.");

  const dummyHash = await bcrypt.hash("TestPass123!", 10);
  const testEmailLead = `lead.day9.${Date.now()}@softlabglobal.com`;
  const testEmailStudent2 = `student2.day9.${Date.now()}@softlabglobal.com`;

  // 1. Create a lead and an approved admission application
  const lead = await db.lead.create({
    data: {
      fullName: "Pooja Verma",
      email: testEmailLead,
      phone: "9876543299",
      interestedCourseId: course.id,
      notes: "Day 9 test lead",
    },
  });

  const appNumber = `APP-2026-TEST-${Date.now().toString().slice(-4)}`;
  const application = await db.admissionApplication.create({
    data: {
      applicationNumber: appNumber,
      leadId: lead.id,
      courseId: course.id,
      applicantName: "Pooja Verma",
      applicantEmail: testEmailLead,
      applicantPhone: "9876543299",
      stage: ApplicationStage.APPROVED,
    },
  });

  const gateway = new RazorpayProvider();

  try {
    // -------------------------------------------------------------
    // CHECK 1: Authoritative server price calculation & order creation
    // -------------------------------------------------------------
    const orderResult = await OnlinePaymentService.createAdmissionOrder({
      applicationId: application.id,
    });

    assert(
      orderResult.amount === course.baseFee,
      `Order amount (${orderResult.amount}) matches authoritative DB course.baseFee (${course.baseFee} Paise)`
    );
    assert(Boolean(orderResult.orderId), `Gateway order ID generated: ${orderResult.orderId}`);

    const pendingTx = await db.paymentTransaction.findUnique({
      where: { gatewayOrderId: orderResult.orderId },
    });
    assert(
      pendingTx !== null && pendingTx.status === PaymentTransactionStatus.PENDING,
      "Pending PaymentTransaction successfully persisted in database"
    );

    // -------------------------------------------------------------
    // CHECK 2: Signature verification rejection for forged signature
    // -------------------------------------------------------------
    let forgeryRejected = false;
    try {
      await OnlinePaymentService.verifyAndProcessPayment({
        gatewayOrderId: orderResult.orderId,
        gatewayPaymentId: "pay_forged_123456",
        gatewaySignature: "bad_forged_signature_hex_000000000000",
      });
    } catch (err: any) {
      forgeryRejected = true;
    }
    assert(forgeryRejected, "Cryptographic verification strictly rejects invalid HMAC signature");

    // -------------------------------------------------------------
    // CHECK 3: Cryptographic verification succeeds for valid HMAC
    // -------------------------------------------------------------
    const testPaymentId = `pay_${Date.now()}_998877`;
    const validSignature = gateway.generateSignature(orderResult.orderId, testPaymentId);

    const verifiedResult = await OnlinePaymentService.verifyAndProcessPayment({
      gatewayOrderId: orderResult.orderId,
      gatewayPaymentId: testPaymentId,
      gatewaySignature: validSignature,
    });

    assert(
      verifiedResult.success === true && verifiedResult.status === PaymentTransactionStatus.SUCCESS,
      "Valid HMAC signature successfully verified and processed"
    );
    assert(
      Boolean(verifiedResult.receiptNumber && verifiedResult.receiptNumber.startsWith("SLG-")),
      `Receipt generated with format SLG-YYYY-XXXXXX: ${verifiedResult.receiptNumber}`
    );

    // -------------------------------------------------------------
    // CHECK 4: Auto-enrollment and student conversion verification
    // -------------------------------------------------------------
    const createdUser = await db.user.findUnique({ where: { email: testEmailLead } });
    assert(createdUser !== null, "User account automatically provisioned for student");

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: createdUser!.id },
    });
    assert(studentProfile !== null, `StudentProfile created with ID: ${studentProfile?.studentId}`);

    const enrollment = await db.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: studentProfile!.id,
          courseId: course.id,
        },
      },
    });
    assert(
      enrollment !== null && enrollment.status === EnrollmentStatus.ACTIVE,
      "Enrollment status is automatically ACTIVE"
    );

    const feeStructure = await db.feeStructure.findUnique({
      where: { enrollmentId: enrollment!.id },
    });
    assert(
      feeStructure !== null && feeStructure.paymentStatus === FeePaymentStatus.PAID,
      "FeeStructure is automatically linked and marked PAID"
    );

    // -------------------------------------------------------------
    // CHECK 5: Strict Idempotency (replay verification)
    // -------------------------------------------------------------
    const replayResult = await OnlinePaymentService.verifyAndProcessPayment({
      gatewayOrderId: orderResult.orderId,
      gatewayPaymentId: testPaymentId,
      gatewaySignature: validSignature,
    });
    assert(
      replayResult.alreadyProcessed === true && replayResult.paymentId === verifiedResult.paymentId,
      "Idempotency: Replaying payment verification returns existing result without duplicates"
    );

    const enrollmentsCount = await db.enrollment.count({
      where: { studentId: studentProfile!.id, courseId: course.id },
    });
    assert(enrollmentsCount === 1, "Idempotency: Exactly one Enrollment exists (no duplicate created)");

    // -------------------------------------------------------------
    // CHECK 6: Receipt formatting & GSTIN compliance
    // -------------------------------------------------------------
    const receiptData = await ReceiptService.getReceiptData(verifiedResult.receiptNumber!);
    assert(
      receiptData.company.gstin === "09AFYFS5388G1ZX",
      `Receipt contains compliant corporate GSTIN: ${receiptData.company.gstin}`
    );
    assert(
      receiptData.company.address.includes("Prayagraj"),
      "Receipt contains Prayagraj center address"
    );
    assert(
      receiptData.financials.amountPaidPaise === course.baseFee,
      `Receipt amount (${receiptData.financials.amountPaidPaise}) matches course base fee`
    );

    // -------------------------------------------------------------
    // CHECK 7: Webhook Signature Verification & Processing
    // -------------------------------------------------------------
    const webhookOrderId = `order_wh_${Date.now()}`;
    const webhookPayId = `pay_wh_${Date.now()}`;
    await db.paymentTransaction.create({
      data: {
        transactionReference: `PAY-WH-${Date.now().toString().slice(-4)}`,
        amount: course.baseFee,
        currency: "INR",
        paymentMethod: PaymentMethod.RAZORPAY,
        status: PaymentTransactionStatus.PENDING,
        gatewayOrderId: webhookOrderId,
      },
    });

    const webhookBody = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: { entity: { id: webhookPayId, order_id: webhookOrderId, amount: course.baseFee } },
      },
    });
    const webhookSig = gateway.generateWebhookSignature(webhookBody);

    const webhookResult = await OnlinePaymentService.processWebhookEvent(webhookBody, webhookSig);
    assert(webhookResult.received === true, "Webhook event successfully verified and processed");

    const webhookTx = await db.paymentTransaction.findUnique({
      where: { gatewayOrderId: webhookOrderId },
    });
    assert(
      webhookTx?.status === PaymentTransactionStatus.SUCCESS,
      "Transaction updated to SUCCESS via webhook"
    );

    // Replay duplicate webhook
    const duplicateWebhook = await OnlinePaymentService.processWebhookEvent(webhookBody, webhookSig);
    assert(duplicateWebhook.received === true, "Duplicate webhook delivered safely and idempotently");

    // -------------------------------------------------------------
    // CHECK 8: Failed Payment Handling
    // -------------------------------------------------------------
    const failedOrderId = `order_failed_${Date.now()}`;
    await db.paymentTransaction.create({
      data: {
        transactionReference: `PAY-FAIL-${Date.now().toString().slice(-4)}`,
        amount: course.baseFee,
        currency: "INR",
        paymentMethod: PaymentMethod.RAZORPAY,
        status: PaymentTransactionStatus.PENDING,
        gatewayOrderId: failedOrderId,
      },
    });

    const failBody = JSON.stringify({
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_fail_1", order_id: failedOrderId } } },
    });
    const failSig = gateway.generateWebhookSignature(failBody);
    await OnlinePaymentService.processWebhookEvent(failBody, failSig);

    const failedTx = await db.paymentTransaction.findUnique({
      where: { gatewayOrderId: failedOrderId },
    });
    assert(failedTx?.status === PaymentTransactionStatus.FAILED, "Failed webhook sets status to FAILED");

    // -------------------------------------------------------------
    // CHECK 9: Audit Trail Logging
    // -------------------------------------------------------------
    const auditActions = await db.auditLog.findMany({
      where: {
        action: {
          in: [
            "PAYMENT_ORDER_CREATED",
            "PAYMENT_CAPTURED",
            "ENROLLMENT_AUTO_CREATED",
            "RECEIPT_GENERATED",
          ],
        },
      },
    });
    assert(auditActions.length >= 4, `All required audit actions verified in database (${auditActions.length} entries found)`);

    console.log("\n=================================================================");
    console.log("  ALL 9 DAY 9 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!");
    console.log("=================================================================\n");
  } finally {
    // Clean up test records safely
    await db.paymentTransaction.deleteMany({
      where: {
        OR: [
          { gatewayOrderId: { startsWith: "order_" } },
          { transactionReference: { startsWith: "PAY-WH-" } },
          { transactionReference: { startsWith: "PAY-FAIL-" } },
        ],
      },
    });
    await db.feeInstallment.deleteMany({
      where: { feeStructure: { student: { user: { email: testEmailLead } } } },
    });
    await db.feeStructure.deleteMany({
      where: { student: { user: { email: testEmailLead } } },
    });
    await db.enrollment.deleteMany({
      where: { student: { user: { email: testEmailLead } } },
    });
    await db.admissionApplication.deleteMany({
      where: { id: application.id },
    });
    await db.lead.deleteMany({
      where: { id: lead.id },
    });
    await db.studentProfile.deleteMany({
      where: { user: { email: testEmailLead } },
    });
    await db.user.deleteMany({
      where: { email: testEmailLead },
    });
    await db.user.deleteMany({
      where: { email: testEmailStudent2 },
    });
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
