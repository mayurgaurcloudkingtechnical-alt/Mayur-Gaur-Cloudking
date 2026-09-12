import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { FeeStructureService } from "@/server/services/fee-structure.service";
import { FeeInstallmentService } from "@/server/services/fee-installment.service";
import { PaymentService } from "@/server/services/payment.service";
import { FeePaymentStatus, PaymentMethod } from "@prisma/client";
import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

export const financeRouter = router({
  // ==========================================
  // FEES & FINANCIAL METRICS
  // ==========================================
  getOverviewMetrics: protectedProcedure.query(async ({ ctx }) => {
    return FeeStructureService.getOverviewMetrics(asAuthUser(ctx.user));
  }),

  listFeeStructures: protectedProcedure
    .input(
      z.object({
        paymentStatus: z.nativeEnum(FeePaymentStatus).optional(),
        courseId: z.string().optional(),
        batchId: z.string().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return FeeStructureService.listFeeStructures(asAuthUser(ctx.user), input);
    }),

  getFeeByEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return FeeStructureService.getByEnrollment(asAuthUser(ctx.user), input.enrollmentId);
    }),

  createFeeStructure: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        registrationFee: z.number().min(0).default(0),
        discountAmount: z.number().min(0).default(0),
        scholarshipAmount: z.number().min(0).default(0),
        remarks: z.string().optional(),
        installments: z
          .array(
            z.object({
              amount: z.number().min(1),
              dueDate: z.date(),
              notes: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeStructureService.createFeeStructure(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // INSTALLMENTS
  // ==========================================
  createInstallmentSchedule: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string(),
        installments: z
          .array(
            z.object({
              amount: z.number().min(1),
              dueDate: z.date(),
              notes: z.string().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeInstallmentService.createSchedule(asAuthUser(ctx.user), input);
    }),

  listInstallments: protectedProcedure
    .input(z.object({ feeStructureId: z.string() }))
    .query(async ({ ctx, input }) => {
      return FeeInstallmentService.listInstallments(asAuthUser(ctx.user), input.feeStructureId);
    }),

  updateInstallment: protectedProcedure
    .input(
      z.object({
        installmentId: z.string(),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return FeeInstallmentService.updateInstallment(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // PAYMENTS
  // ==========================================
  recordOfflinePayment: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string(),
        installmentId: z.string().optional(),
        amount: z.number().min(1), // In Paise
        paymentMethod: z.nativeEnum(PaymentMethod),
        providerReference: z.string().optional(),
        remarks: z.string().optional(),
        paymentDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PaymentService.recordOfflinePayment(asAuthUser(ctx.user), input);
    }),

  listPayments: protectedProcedure
    .input(
      z.object({
        feeStructureId: z.string().optional(),
        studentId: z.string().optional(),
        paymentMethod: z.nativeEnum(PaymentMethod).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      return PaymentService.listPayments(asAuthUser(ctx.user), input);
    }),

  getPaymentDetails: protectedProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return PaymentService.getPaymentDetails(asAuthUser(ctx.user), input.paymentId);
    }),

  // ==========================================
  // STUDENT SELF-SERVICE
  // ==========================================
  getMyFeeOverview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.roleCode !== "STUDENT" && ctx.user.roleCode !== "SUPER_ADMIN") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only enrolled students can view their fee overview." });
    }

    const studentProfile = await db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!studentProfile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }

    const feeStructures = await db.feeStructure.findMany({
      where: { studentId: studentProfile.id, status: "ACTIVE" },
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, code: true, name: true } },
        installments: { orderBy: { installmentNumber: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
    });

    return {
      studentId: studentProfile.studentId,
      feeStructures,
    };
  }),
});
