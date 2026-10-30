import { router, publicProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { OnlinePaymentService } from "@/server/services/online-payment.service";
import { ReceiptService } from "@/server/services/receipt.service";
import { db } from "@/server/db/client";

export const paymentRouter = router({
  /**
   * Public/Applicant procedure to generate an authoritative payment order.
   */
  createAdmissionOrder: publicProcedure
    .input(
      z.object({
        applicationId: z.string().min(1, "Application ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      return OnlinePaymentService.createAdmissionOrder(input);
    }),

  /**
   * Public procedure to initiate an authoritative Razorpay order for an issued GST Invoice.
   */
  createInvoicePaymentOrder: publicProcedure
    .input(
      z.object({
        invoiceNumber: z.string().min(1, "Invoice number is required"),
        amountPaise: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return OnlinePaymentService.createInvoicePaymentOrder(input);
    }),

  /**
   * Cryptographically verifies and processes checkout payment.
   */
  verifyPayment: publicProcedure
    .input(
      z.object({
        gatewayOrderId: z.string().min(1),
        gatewayPaymentId: z.string().min(1),
        gatewaySignature: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return OnlinePaymentService.verifyAndProcessPayment(input);
    }),

  /**
   * Checks authoritative server status of a payment/order.
   */
  getStatus: publicProcedure
    .input(
      z.object({
        identifier: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return OnlinePaymentService.getPaymentStatus(input.identifier);
    }),

  /**
   * Student self-service payment history.
   */
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.roleCode === "STUDENT") {
      const student = await db.studentProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!student) {
        return [];
      }

      return db.paymentTransaction.findMany({
        where: { studentId: student.id },
        orderBy: { paymentDate: "desc" },
        include: {
          feeStructure: { include: { course: true } },
          enrollment: { include: { course: true } },
          admission: { include: { course: true } },
        },
      });
    }

    // Admin / Staff view
    const allowed = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "DIRECTOR", "MANAGER"];
    if (!allowed.includes(ctx.user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permission to view payments ledger.",
      });
    }

    return db.paymentTransaction.findMany({
      take: 50,
      orderBy: { paymentDate: "desc" },
      include: {
        student: { include: { user: true } },
        admission: { include: { course: true } },
        feeStructure: { include: { course: true } },
      },
    });
  }),

  /**
   * Fetches formatted printable receipt data.
   */
  getReceipt: protectedProcedure
    .input(
      z.object({
        identifier: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const data = await ReceiptService.getReceiptData(input.identifier);

      // Student isolation check: Student can only access their own receipt
      if (ctx.user.roleCode === "STUDENT") {
        const student = await db.studentProfile.findUnique({
          where: { userId: ctx.user.id },
          include: { user: true },
        });

        if (
          student &&
          data.student.email !== student.user.email &&
          data.student.studentId !== student.studentId
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied to requested payment receipt.",
          });
        }
      }

      return data;
    }),

  /**
   * Enrolled student procedure to initiate payment for tuition fee / installment.
   */
  createFeePaymentOrder: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string().min(1),
        installmentId: z.string().optional(),
        amountPaise: z.number().int().positive().optional(),
        provider: z.enum(["STRIPE", "RAZORPAY", "AUTO"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let studentProfileId = "";

      if (ctx.user.roleCode === "STUDENT") {
        const profile = await db.studentProfile.findUnique({
          where: { userId: ctx.user.id },
        });
        if (!profile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Student profile not found.",
          });
        }
        studentProfileId = profile.id;
      } else {
        // Staff/Admin initiating payment on behalf of student
        const fee = await db.feeStructure.findUnique({
          where: { id: input.feeStructureId },
        });
        if (!fee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fee structure not found.",
          });
        }
        studentProfileId = fee.studentId;
      }

      return OnlinePaymentService.createInstallmentOrder({
        studentProfileId,
        feeStructureId: input.feeStructureId,
        installmentId: input.installmentId,
        amountPaise: input.amountPaise,
        provider: input.provider,
      });
    }),

  /**
   * Cryptographically verifies fee payment completion and settles balances.
   */
  verifyFeePayment: protectedProcedure
    .input(
      z.object({
        gatewayOrderId: z.string().min(1),
        gatewayPaymentId: z.string().min(1),
        gatewaySignature: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return OnlinePaymentService.verifyAndProcessFeePayment(input);
    }),

  /**
   * Student procedure to initiate an authoritative Razorpay order for direct Marketplace purchase.
   */
  createMarketplaceOrder: protectedProcedure
    .input(
      z.object({
        courseId: z.string().min(1, "Course ID is required"),
        learningMode: z.enum(["ONLINE", "CLASSROOM", "HYBRID"]).optional(),
        paymentPlan: z.enum(["FULL", "TOKEN"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Check if course exists and is published
      const course = await db.course.findUnique({
        where: { id: input.courseId },
      });

      if (!course || course.status !== "PUBLISHED" || course.deletedAt) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course not found or unavailable for enrollment.",
        });
      }

      // 2. Check if student already enrolled
      const studentProfile = await db.studentProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (studentProfile) {
        const existingEnrollment = await db.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: studentProfile.id,
              courseId: course.id,
            },
          },
        });

        if (existingEnrollment && existingEnrollment.status === "ACTIVE") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `You are already enrolled in "${course.title}". Access it under My Enrolled Courses.`,
          });
        }
      }

      // 3. Authoritative Pricing calculation
      const fullFeePaise = course.discountedFee && course.discountedFee > 0 ? course.discountedFee : course.baseFee;
      const tokenAmountPaise = Math.min(500000, fullFeePaise);
      const payableAmountPaise = input.paymentPlan === "TOKEN" ? tokenAmountPaise : fullFeePaise;

      const { getRazorpayProvider } = await import("@/server/lib/payment");
      const gateway = getRazorpayProvider();

      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      const txRef = `PAY-${year}-${rand}`;

      const order = await gateway.createOrder({
        amount: payableAmountPaise,
        currency: "INR",
        receipt: txRef,
        notes: {
          courseId: course.id,
          courseTitle: course.title,
          userId: ctx.user.id,
          studentProfileId: studentProfile?.id || "",
          learningMode: input.learningMode || "HYBRID",
          paymentPlan: input.paymentPlan || "FULL",
        },
      });

      const { PaymentMethod, PaymentTransactionStatus } = await import("@prisma/client");

      await db.paymentTransaction.create({
        data: {
          transactionReference: txRef,
          amount: payableAmountPaise,
          currency: "INR",
          paymentMethod: PaymentMethod.RAZORPAY,
          status: PaymentTransactionStatus.PENDING,
          gateway: "RAZORPAY",
          gatewayOrderId: order.orderId,
          studentId: studentProfile?.id || undefined,
          remarks: `Marketplace Direct Purchase: ${course.title} (${input.learningMode || "HYBRID"}). Plan: ${input.paymentPlan || "FULL"}`,
          metadata: {
            courseId: course.id,
            courseTitle: course.title,
            userId: ctx.user.id,
            learningMode: input.learningMode || "HYBRID",
            paymentPlan: input.paymentPlan || "FULL",
          },
        },
      });

      return {
        orderId: order.orderId,
        amount: payableAmountPaise,
        currency: "INR",
        keyId: order.keyId,
        courseTitle: course.title,
        studentName: `${ctx.user.firstName || ""} ${ctx.user.lastName || ""}`.trim() || ctx.user.email,
        studentEmail: ctx.user.email,
        studentPhone: ctx.user.phone || "",
        transactionReference: txRef,
      };
    }),

  /**
   * Cryptographically verifies direct marketplace purchase and immediately activates enrollment.
   */
  verifyMarketplacePurchase: protectedProcedure
    .input(
      z.object({
        gatewayOrderId: z.string().min(1),
        gatewayPaymentId: z.string().min(1),
        gatewaySignature: z.string().min(1),
        courseId: z.string().min(1),
        learningMode: z.enum(["ONLINE", "CLASSROOM", "HYBRID"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { getRazorpayProvider } = await import("@/server/lib/payment");
      const gateway = getRazorpayProvider();

      const isValid = gateway.verifyPaymentSignature({
        orderId: input.gatewayOrderId,
        paymentId: input.gatewayPaymentId,
        signature: input.gatewaySignature,
      });

      if (!isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cryptographic payment verification failed. Untrusted signature.",
        });
      }

      return await db.$transaction(async (tx) => {
        const paymentTx = await tx.paymentTransaction.findUnique({
          where: { gatewayOrderId: input.gatewayOrderId },
        });

        if (!paymentTx) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Payment order record not found.",
          });
        }

        if (paymentTx.status === "SUCCESS") {
          return {
            success: true,
            receiptNumber: paymentTx.receiptNumber,
            enrollmentId: paymentTx.enrollmentId,
            alreadyProcessed: true,
          };
        }

        const course = await tx.course.findUnique({
          where: { id: input.courseId },
        });

        if (!course) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Course record not found.",
          });
        }

        const now = new Date();

        // 1. Ensure StudentProfile exists for logged-in user
        let studentProfile = await tx.studentProfile.findUnique({
          where: { userId: ctx.user.id },
        });

        if (!studentProfile) {
          const count = await tx.studentProfile.count();
          const studentCode = `SG-${now.getFullYear()}-${(count + 1).toString().padStart(5, "0")}`;
          studentProfile = await tx.studentProfile.create({
            data: {
              userId: ctx.user.id,
              studentId: studentCode,
            },
          });
        }

        // 2. Create formal AdmissionApplication
        const appCount = await tx.admissionApplication.count();
        const applicationNumber = `ADM-${now.getFullYear()}-${(appCount + 1).toString().padStart(5, "0")}`;
        const applicantName = `${ctx.user.firstName || ""} ${ctx.user.lastName || ""}`.trim() || ctx.user.email;

        const application = await tx.admissionApplication.create({
          data: {
            applicationNumber,
            courseId: course.id,
            applicantName,
            applicantEmail: ctx.user.email,
            applicantPhone: ctx.user.phone || "0000000000",
            stage: "CONVERTED",
            status: "CONFIRMED",
            convertedAt: now,
            dateOfBirth: studentProfile.dateOfBirth,
            gender: studentProfile.gender,
            address: studentProfile.address,
            city: studentProfile.city,
            state: studentProfile.state,
            pincode: studentProfile.pincode,
          },
        });

        // 3. Create or Activate Enrollment
        let enrollment = await tx.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: studentProfile.id,
              courseId: course.id,
            },
          },
        });

        if (!enrollment) {
          enrollment = await tx.enrollment.create({
            data: {
              studentId: studentProfile.id,
              courseId: course.id,
              status: "ACTIVE",
              enrolledAt: now,
            },
          });
        } else {
          enrollment = await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { status: "ACTIVE" },
          });
        }

        // 4. Create FeeStructure and FeePayment
        const fullCourseFee = course.discountedFee && course.discountedFee > 0 ? course.discountedFee : course.baseFee;
        let feeStructure = await tx.feeStructure.findFirst({
          where: { studentId: studentProfile.id, courseId: course.id },
        });

        if (!feeStructure) {
          feeStructure = await tx.feeStructure.create({
            data: {
              studentId: studentProfile.id,
              courseId: course.id,
              enrollmentId: enrollment.id,
              totalAmount: fullCourseFee,
              paidAmount: paymentTx.amount,
              pendingAmount: Math.max(0, fullCourseFee - paymentTx.amount),
              status: paymentTx.amount >= fullCourseFee ? "PAID" : "PARTIALLY_PAID",
            },
          });
        } else {
          const newPaid = feeStructure.paidAmount + paymentTx.amount;
          feeStructure = await tx.feeStructure.update({
            where: { id: feeStructure.id },
            data: {
              paidAmount: newPaid,
              pendingAmount: Math.max(0, feeStructure.totalAmount - newPaid),
              status: newPaid >= feeStructure.totalAmount ? "PAID" : "PARTIALLY_PAID",
            },
          });
        }

        const receiptNumber = await ReceiptService.generateReceiptNumber();

        await tx.feePayment.create({
          data: {
            feeStructureId: feeStructure.id,
            amountPaid: paymentTx.amount,
            paymentMethod: "RAZORPAY",
            paymentDate: now,
            receiptNumber,
            transactionReference: paymentTx.transactionReference,
            remarks: `Marketplace Razorpay Enrollment: ${course.title}`,
          },
        });

        // 5. Update PaymentTransaction
        await tx.paymentTransaction.update({
          where: { id: paymentTx.id },
          data: {
            status: "SUCCESS",
            gatewayPaymentId: input.gatewayPaymentId,
            gatewaySignature: input.gatewaySignature,
            receiptNumber,
            paidAt: now,
            studentId: studentProfile.id,
            enrollmentId: enrollment.id,
            feeStructureId: feeStructure.id,
            admissionId: application.id,
          },
        });

        // 6. Generate Statutory Tax Invoice
        let invoiceNumber: string | null = null;
        try {
          const { GstBillingService } = await import("@/server/services/gst-billing.service");
          const invoice = await GstBillingService.ensureAndSettleInvoiceForPayment(tx, {
            paymentTransactionId: paymentTx.id,
            amountPaise: paymentTx.amount,
            paymentMethod: "RAZORPAY",
            paymentReference: receiptNumber,
            paidAt: now,
            customerName: applicantName,
            customerEmail: ctx.user.email,
            customerPhone: ctx.user.phone || null,
            customerState: "Uttar Pradesh",
            customerStateCode: "09",
            courseTitle: course.title,
            hsnSacCode: "999293",
            isTaxInclusive: true,
          });
          invoiceNumber = invoice?.invoiceNumber || null;
        } catch (invErr) {
          console.error("[MarketplacePurchase] Invoice settlement error:", invErr);
        }

        // 7. Audit log
        await AuditService.log({
          actorId: ctx.user.id,
          action: "MARKETPLACE_COURSE_PURCHASED",
          resourceType: "Enrollment",
          resourceId: enrollment.id,
          newData: {
            courseId: course.id,
            courseTitle: course.title,
            studentId: studentProfile.studentId,
            receiptNumber,
            invoiceNumber,
            amountPaise: paymentTx.amount,
          },
        });

        return {
          success: true,
          enrollmentId: enrollment.id,
          receiptNumber,
          invoiceNumber,
          courseTitle: course.title,
          studentId: studentProfile.studentId,
          amountPaidPaise: paymentTx.amount,
        };
      });
    }),

  /**
   * Returns active connection status of Stripe, Razorpay, and environment settings.
   */
  getGatewayStatus: publicProcedure.query(() => {
    return OnlinePaymentService.getGatewayStatus();
  }),
});

