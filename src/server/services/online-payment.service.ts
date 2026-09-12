import { db } from "@/server/db/client";
import { getPaymentGateway } from "@/server/lib/payment";
import { ReceiptService } from "./receipt.service";
import { AuditService } from "./audit.service";
import { AutoEnrollmentService } from "./auto-enrollment.service";
import { TRPCError } from "@trpc/server";
import { ApplicationStage, PaymentMethod, PaymentTransactionStatus } from "@prisma/client";
import { env } from "@/lib/env";

export interface CreateAdmissionOrderInput {
  applicationId: string;
  metadata?: Record<string, string>;
}

export interface VerifyPaymentInput {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
  bypassSignatureCheck?: boolean;
}

export class OnlinePaymentService {
  private static async generateTransactionReference(): Promise<string> {
    const year = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const ref = `PAY-${year}-${rand}`;
      const existing = await db.paymentTransaction.findUnique({
        where: { transactionReference: ref },
      });
      if (!existing) return ref;
    }
    return `PAY-${year}-${Date.now().toString().slice(-4)}`;
  }

  /**
   * 1. INITIATE ADMISSION PAYMENT
   */
  static async createAdmissionOrder(input: CreateAdmissionOrderInput) {
    const application = await db.admissionApplication.findUnique({
      where: { id: input.applicationId },
      include: { course: true, lead: true },
    });

    if (!application) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Application '${input.applicationId}' not found.`,
      });
    }

    if (application.stage === ApplicationStage.CONVERTED) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This application has already been converted and enrolled.",
      });
    }

    const authoritativeAmountPaise = application.course.baseFee;
    if (!authoritativeAmountPaise || authoritativeAmountPaise <= 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Course fee configuration is invalid.",
      });
    }

    const txRef = await this.generateTransactionReference();
    const gateway = getPaymentGateway();

    const order = await gateway.createOrder({
      amount: authoritativeAmountPaise,
      currency: "INR",
      receipt: txRef,
      notes: {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        courseId: application.courseId,
      },
    });

    const paymentTx = await db.paymentTransaction.create({
      data: {
        transactionReference: txRef,
        amount: authoritativeAmountPaise,
        currency: "INR",
        paymentMethod: PaymentMethod.RAZORPAY,
        status: PaymentTransactionStatus.PENDING,
        admissionId: application.id,
        gateway: gateway.providerName,
        gatewayOrderId: order.orderId,
        remarks: `Online admission payment order for ${application.course.title}`,
      },
    });

    await AuditService.log({
      action: "PAYMENT_ORDER_CREATED",
      resourceType: "PaymentTransaction",
      resourceId: paymentTx.id,
      newData: {
        gatewayOrderId: order.orderId,
        amount: authoritativeAmountPaise,
        applicationId: application.id,
      },
    });

    const keyId = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock";

    return {
      keyId,
      orderId: order.orderId,
      amount: authoritativeAmountPaise,
      currency: "INR",
      courseTitle: application.course.title,
      applicantName: application.applicantName,
      applicantEmail: application.applicantEmail,
      applicantPhone: application.applicantPhone,
      transactionReference: txRef,
    };
  }

  /**
   * 2. VERIFY AND PROCESS PAYMENT (IDEMPOTENT)
   */
  static async verifyAndProcessPayment(input: VerifyPaymentInput) {
    const gateway = getPaymentGateway();

    if (!input.bypassSignatureCheck) {
      const isValid = gateway.verifyPaymentSignature({
        orderId: input.gatewayOrderId,
        paymentId: input.gatewayPaymentId,
        signature: input.gatewaySignature,
      });

      if (!isValid) {
        await AuditService.log({
          action: "PAYMENT_VERIFICATION_FAILED",
          resourceType: "PaymentTransaction",
          resourceId: input.gatewayOrderId,
          newData: { orderId: input.gatewayOrderId, paymentId: input.gatewayPaymentId },
        });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment signature verification failed. Untrusted response.",
        });
      }
    }

    return await db.$transaction(async (tx) => {
      const existingTx = await tx.paymentTransaction.findUnique({
        where: { gatewayOrderId: input.gatewayOrderId },
        include: { admission: { include: { course: true } } },
      });

      if (!existingTx) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Payment order '${input.gatewayOrderId}' not found in database.`,
        });
      }

      // Idempotency: return existing result if already processed
      if (existingTx.status === PaymentTransactionStatus.SUCCESS) {
        return {
          success: true,
          paymentId: existingTx.id,
          receiptNumber: existingTx.receiptNumber,
          enrollmentId: existingTx.enrollmentId,
          status: existingTx.status,
          alreadyProcessed: true,
        };
      }

      const receiptNumber = await ReceiptService.generateReceiptNumber();
      const now = new Date();

      let studentProfileId = existingTx.studentId;
      let enrollmentId = existingTx.enrollmentId;
      let feeStructureId = existingTx.feeStructureId;

      if (existingTx.admissionId && existingTx.admission) {
        const provision = await AutoEnrollmentService.provisionFromAdmission(
          tx,
          existingTx.admission,
          existingTx.amount,
          now
        );
        studentProfileId = provision.studentProfileId;
        enrollmentId = provision.enrollmentId;
        feeStructureId = provision.feeStructureId;
      }

      const updatedPayment = await tx.paymentTransaction.update({
        where: { id: existingTx.id },
        data: {
          status: PaymentTransactionStatus.SUCCESS,
          gatewayPaymentId: input.gatewayPaymentId,
          gatewaySignature: input.gatewaySignature,
          receiptNumber,
          paidAt: now,
          studentId: studentProfileId,
          enrollmentId,
          feeStructureId,
        },
      });

      await AuditService.log({
        action: "PAYMENT_CAPTURED",
        resourceType: "PaymentTransaction",
        resourceId: updatedPayment.id,
        newData: {
          gatewayOrderId: input.gatewayOrderId,
          gatewayPaymentId: input.gatewayPaymentId,
          receiptNumber,
          amount: updatedPayment.amount,
        },
      });

      await AuditService.log({
        action: "ENROLLMENT_AUTO_CREATED",
        resourceType: "Enrollment",
        resourceId: enrollmentId || "unknown",
        newData: { studentProfileId, courseId: existingTx.admission?.courseId },
      });

      await AuditService.log({
        action: "RECEIPT_GENERATED",
        resourceType: "PaymentTransaction",
        resourceId: updatedPayment.id,
        newData: { receiptNumber },
      });

      return {
        success: true,
        paymentId: updatedPayment.id,
        receiptNumber,
        enrollmentId,
        status: PaymentTransactionStatus.SUCCESS,
        alreadyProcessed: false,
      };
    });
  }

  /**
   * 3. PROCESS WEBHOOK EVENT (IDEMPOTENT)
   */
  static async processWebhookEvent(rawBody: string, signature: string) {
    const gateway = getPaymentGateway();
    const isValid = gateway.verifyWebhookSignature({ rawBody, signature });

    if (!isValid) {
      await AuditService.log({
        action: "WEBHOOK_SIGNATURE_REJECTED",
        resourceType: "PaymentTransaction",
        resourceId: "webhook",
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid webhook HMAC signature.",
      });
    }

    const payload = JSON.parse(rawBody) as {
      event: string;
      payload?: {
        payment?: { entity: { id: string; order_id: string; amount: number } };
        order?: { entity: { id: string; amount: number } };
      };
    };

    await AuditService.log({
      action: "PAYMENT_WEBHOOK_RECEIVED",
      resourceType: "PaymentTransaction",
      resourceId: payload.event,
      newData: { event: payload.event },
    });

    if (payload.event === "payment.captured" || payload.event === "order.paid") {
      const pEntity = payload.payload?.payment?.entity;
      const oEntity = payload.payload?.order?.entity;
      const orderId = pEntity?.order_id || oEntity?.id;
      const paymentId = pEntity?.id || `pay_${Date.now()}`;

      if (orderId) {
        await this.verifyAndProcessPayment({
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: signature,
          bypassSignatureCheck: true,
        });
      }
    } else if (payload.event === "payment.failed") {
      const pEntity = payload.payload?.payment?.entity;
      if (pEntity?.order_id) {
        await db.paymentTransaction.updateMany({
          where: {
            gatewayOrderId: pEntity.order_id,
            status: PaymentTransactionStatus.PENDING,
          },
          data: { status: PaymentTransactionStatus.FAILED },
        });

        await AuditService.log({
          action: "PAYMENT_FAILED",
          resourceType: "PaymentTransaction",
          resourceId: pEntity.order_id,
        });
      }
    }

    return { received: true };
  }

  /**
   * 4. GET PAYMENT STATUS
   */
  static async getPaymentStatus(orderIdOrPaymentId: string) {
    const payment = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { id: orderIdOrPaymentId },
          { gatewayOrderId: orderIdOrPaymentId },
          { gatewayPaymentId: orderIdOrPaymentId },
          { transactionReference: orderIdOrPaymentId },
          { receiptNumber: orderIdOrPaymentId },
        ],
      },
      include: {
        admission: { include: { course: true } },
        enrollment: { include: { course: true } },
        student: { include: { user: true } },
      },
    });

    if (!payment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Payment record not found.",
      });
    }

    const courseTitle =
      payment.admission?.course.title ||
      payment.enrollment?.course.title ||
      "Professional Course";

    return {
      id: payment.id,
      transactionReference: payment.transactionReference,
      gatewayOrderId: payment.gatewayOrderId,
      gatewayPaymentId: payment.gatewayPaymentId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      status: payment.status,
      paymentDate: payment.paymentDate,
      paidAt: payment.paidAt,
      courseTitle,
      studentName: payment.student?.user
        ? `${payment.student.user.firstName} ${payment.student.user.lastName}`.trim()
        : payment.admission?.applicantName,
      enrollmentStatus: payment.enrollment?.status || null,
    };
  }
}
