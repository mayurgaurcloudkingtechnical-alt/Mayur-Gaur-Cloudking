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
   * Returns active connection status of Stripe, Razorpay, and environment settings.
   */
  getGatewayStatus: publicProcedure.query(() => {
    return OnlinePaymentService.getGatewayStatus();
  }),
});

