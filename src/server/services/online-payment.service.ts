import { db } from "@/server/db/client";
import { getPaymentGateway, getStripeProvider, getPaymentGatewaysStatus } from "@/server/lib/payment";
import { ReceiptService } from "./receipt.service";
import { AuditService } from "./audit.service";
import { AutoEnrollmentService } from "./auto-enrollment.service";
import { TRPCError } from "@trpc/server";
import { ApplicationStage, PaymentMethod, PaymentTransactionStatus, FeePaymentStatus, InstallmentStatus } from "@prisma/client";
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
    }, { maxWait: 15000, timeout: 30000 });
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

  /**
   * 5. INITIATE FEE INSTALLMENT / OUTSTANDING PAYMENT
   */
  static async createInstallmentOrder(input: {
    studentProfileId: string;
    feeStructureId: string;
    installmentId?: string;
    amountPaise?: number;
    provider?: "STRIPE" | "RAZORPAY" | "AUTO";
  }) {
    const feeStructure = await db.feeStructure.findUnique({
      where: { id: input.feeStructureId },
      include: {
        course: true,
        installments: { orderBy: { installmentNumber: "asc" } },
        student: { include: { user: true } },
      },
    });

    if (!feeStructure) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Fee record not found.",
      });
    }

    if (feeStructure.studentId !== input.studentProfileId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied to requested student fee ledger.",
      });
    }

    if (feeStructure.paymentStatus === FeePaymentStatus.PAID) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This fee account has already been fully paid and settled.",
      });
    }

    let authoritativeAmountPaise = 0;
    let description = `Tuition Fee - ${feeStructure.course.title}`;

    if (input.installmentId) {
      const installment = feeStructure.installments.find((i) => i.id === input.installmentId);
      if (!installment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected installment milestone not found.",
        });
      }
      if (installment.status === InstallmentStatus.PAID) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Installment #${installment.installmentNumber} has already been paid.`,
        });
      }
      authoritativeAmountPaise = installment.amount - installment.paidAmount;
      description = `Installment #${installment.installmentNumber} - ${feeStructure.course.title}`;
    } else if (input.amountPaise && input.amountPaise > 0) {
      authoritativeAmountPaise = Math.min(input.amountPaise, feeStructure.pendingAmount);
    } else {
      // Default to the first pending installment or total pending amount
      const pendingInst = feeStructure.installments.find(
        (i) => i.status !== InstallmentStatus.PAID
      );
      authoritativeAmountPaise = pendingInst
        ? pendingInst.amount - pendingInst.paidAmount
        : feeStructure.pendingAmount;
    }

    if (authoritativeAmountPaise <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No outstanding amount due for payment.",
      });
    }

    const txRef = await this.generateTransactionReference();
    const gateway = getPaymentGateway(input.provider);

    const order = await gateway.createOrder({
      amount: authoritativeAmountPaise,
      currency: "INR",
      receipt: txRef,
      description,
      customerEmail: feeStructure.student.user.email,
      customerName: `${feeStructure.student.user.firstName} ${feeStructure.student.user.lastName}`.trim(),
      notes: {
        studentId: feeStructure.studentId,
        feeStructureId: feeStructure.id,
        installmentId: input.installmentId || "",
      },
    });

    const paymentMethod =
      gateway.providerName === "STRIPE" ? PaymentMethod.STRIPE : PaymentMethod.RAZORPAY;

    const paymentTx = await db.paymentTransaction.create({
      data: {
        transactionReference: txRef,
        amount: authoritativeAmountPaise,
        currency: "INR",
        paymentMethod,
        status: PaymentTransactionStatus.PENDING,
        studentId: feeStructure.studentId,
        enrollmentId: feeStructure.enrollmentId,
        feeStructureId: feeStructure.id,
        installmentId: input.installmentId || null,
        gateway: gateway.providerName,
        gatewayOrderId: order.orderId,
        remarks: description,
      },
    });

    await AuditService.log({
      action: "FEE_PAYMENT_ORDER_CREATED",
      resourceType: "PaymentTransaction",
      resourceId: paymentTx.id,
      newData: {
        gatewayOrderId: order.orderId,
        amount: authoritativeAmountPaise,
        studentId: feeStructure.studentId,
        feeStructureId: feeStructure.id,
        installmentId: input.installmentId,
      },
    });

    const keyId =
      gateway.providerName === "STRIPE"
        ? getStripeProvider().getPublishableKey() || "pk_test_mock"
        : env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mock";

    return {
      keyId,
      orderId: order.orderId,
      amount: authoritativeAmountPaise,
      currency: "INR",
      courseTitle: feeStructure.course.title,
      description,
      transactionReference: txRef,
      checkoutUrl: order.checkoutUrl,
      clientSecret: order.clientSecret,
      provider: gateway.providerName,
    };
  }

  /**
   * 6. VERIFY AND PROCESS STUDENT FEE PAYMENT (IDEMPOTENT)
   */
  static async verifyAndProcessFeePayment(input: VerifyPaymentInput) {
    const txRecord = await db.paymentTransaction.findFirst({
      where: {
        OR: [
          { gatewayOrderId: input.gatewayOrderId },
          { transactionReference: input.gatewayOrderId },
        ],
      },
      include: {
        feeStructure: { include: { course: true, installments: true } },
        installment: true,
      },
    });

    if (!txRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Payment order '${input.gatewayOrderId}' not found in database.`,
      });
    }

    if (!input.bypassSignatureCheck) {
      const gateway = getPaymentGateway(txRecord.gateway as any);
      const isValid = gateway.verifyPaymentSignature({
        orderId: input.gatewayOrderId,
        paymentId: input.gatewayPaymentId,
        signature: input.gatewaySignature,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment signature verification failed. Untrusted response.",
        });
      }
    }

    return await db.$transaction(async (tx) => {
      // Idempotency: return existing result if already processed
      if (txRecord.status === PaymentTransactionStatus.SUCCESS) {
        return {
          success: true,
          paymentId: txRecord.id,
          receiptNumber: txRecord.receiptNumber,
          status: txRecord.status,
          alreadyProcessed: true,
        };
      }

      const receiptNumber = await ReceiptService.generateReceiptNumber();
      const now = new Date();

      // 1. Update Payment Transaction
      const updatedTx = await tx.paymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: PaymentTransactionStatus.SUCCESS,
          gatewayPaymentId: input.gatewayPaymentId,
          gatewaySignature: input.gatewaySignature,
          receiptNumber,
          paidAt: now,
        },
      });

      // 2. Update Fee Structure Balances
      if (txRecord.feeStructureId && txRecord.feeStructure) {
        const currentPaid = txRecord.feeStructure.paidAmount;
        const newPaid = currentPaid + txRecord.amount;
        const newPending = Math.max(0, txRecord.feeStructure.netPayableAmount - newPaid);
        const newPaymentStatus =
          newPending <= 0 ? FeePaymentStatus.PAID : FeePaymentStatus.PARTIAL;

        await tx.feeStructure.update({
          where: { id: txRecord.feeStructureId },
          data: {
            paidAmount: newPaid,
            pendingAmount: newPending,
            paymentStatus: newPaymentStatus,
          },
        });
      }

      // 3. Update Installment Milestone if linked
      if (txRecord.installmentId && txRecord.installment) {
        const instPaid = txRecord.installment.paidAmount + txRecord.amount;
        const instStatus =
          instPaid >= txRecord.installment.amount
            ? InstallmentStatus.PAID
            : InstallmentStatus.PARTIAL;

        await tx.feeInstallment.update({
          where: { id: txRecord.installmentId },
          data: {
            paidAmount: instPaid,
            status: instStatus,
            paidAt: now,
          },
        });
      }

      await AuditService.log({
        action: "FEE_PAYMENT_CAPTURED",
        resourceType: "PaymentTransaction",
        resourceId: updatedTx.id,
        newData: {
          receiptNumber,
          amount: txRecord.amount,
          feeStructureId: txRecord.feeStructureId,
          installmentId: txRecord.installmentId,
        },
      });

      return {
        success: true,
        paymentId: updatedTx.id,
        receiptNumber,
        status: PaymentTransactionStatus.SUCCESS,
        alreadyProcessed: false,
      };
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * 7. PROCESS STRIPE WEBHOOK EVENT (IDEMPOTENT)
   */
  static async processStripeWebhookEvent(rawBody: string, signature: string) {
    const stripe = getStripeProvider();
    const isValid = stripe.verifyWebhookSignature({ rawBody, signature });

    if (!isValid) {
      await AuditService.log({
        action: "STRIPE_WEBHOOK_SIGNATURE_REJECTED",
        resourceType: "PaymentTransaction",
        resourceId: "stripe_webhook",
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid Stripe webhook HMAC signature.",
      });
    }

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: {
        object: {
          id: string;
          client_reference_id?: string;
          amount_total?: number;
          amount?: number;
          payment_intent?: string;
          metadata?: Record<string, string>;
        };
      };
    };

    await AuditService.log({
      action: "STRIPE_WEBHOOK_RECEIVED",
      resourceType: "PaymentTransaction",
      resourceId: event.id,
      newData: { eventType: event.type },
    });

    const obj = event.data?.object;
    if (!obj) return { received: true, ignored: true };

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
      const orderId = obj.id;
      const receiptRef = obj.client_reference_id || obj.metadata?.receipt;
      const paymentId = (typeof obj.payment_intent === "string" ? obj.payment_intent : obj.id) || `str_${Date.now()}`;

      // Check if this is an admission transaction or fee installment
      const existingTx = await db.paymentTransaction.findFirst({
        where: {
          OR: [
            { gatewayOrderId: orderId },
            ...(receiptRef ? [{ transactionReference: receiptRef }] : []),
          ],
        },
      });

      if (existingTx) {
        if (existingTx.admissionId) {
          await this.verifyAndProcessPayment({
            gatewayOrderId: existingTx.gatewayOrderId || orderId,
            gatewayPaymentId: paymentId,
            gatewaySignature: signature,
            bypassSignatureCheck: true,
          });
        } else {
          await this.verifyAndProcessFeePayment({
            gatewayOrderId: existingTx.gatewayOrderId || orderId,
            gatewayPaymentId: paymentId,
            gatewaySignature: signature,
            bypassSignatureCheck: true,
          });
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const orderId = obj.id;
      await db.paymentTransaction.updateMany({
        where: {
          gatewayOrderId: orderId,
          status: PaymentTransactionStatus.PENDING,
        },
        data: { status: PaymentTransactionStatus.FAILED },
      });
    }

    return { received: true, event: event.type };
  }

  /**
   * 8. GET GATEWAY STATUS
   */
  static getGatewayStatus() {
    return getPaymentGatewaysStatus();
  }
}
