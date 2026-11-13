import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  VerificationType,
  VerificationStatus,
  UserRoleCode,
} from "@prisma/client";
import { VerificationEngineService } from "@/server/services/verification/verification-engine.service";
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

export const verificationRouter = router({
  // ==========================================
  // METRICS & LISTING
  // ==========================================
  getMetrics: protectedProcedure.query(async () => {
    return VerificationEngineService.getMetrics();
  }),

  listRecords: protectedProcedure
    .input(
      z.object({
        verificationType: z.nativeEnum(VerificationType).optional(),
        status: z.nativeEnum(VerificationStatus).optional(),
        entityType: z.string().optional(),
        search: z.string().optional(),
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(20),
      })
    )
    .query(async ({ input }) => {
      return VerificationEngineService.listRecords(input);
    }),

  // ==========================================
  // CONSENT RECORDING
  // ==========================================
  recordConsent: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1, "User ID is required"),
        purpose: z.string().min(5, "Purpose explanation is required"),
        termsVersion: z.string().optional(),
        alternativeOffered: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return VerificationEngineService.recordConsent({
        ...input,
        ipAddress: (ctx as any).req?.headers?.["x-forwarded-for"] || "127.0.0.1",
        userAgent: (ctx as any).req?.headers?.["user-agent"] || "Next.js App",
      });
    }),

  // ==========================================
  // VERIFICATION INITIATIONS
  // ==========================================
  initiatePanVerification: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["StaffProfile", "Vendor", "CorporatePartner", "User", "Franchise"]),
        entityId: z.string().min(1),
        panNumber: z.string().min(10).max(10),
        declaredName: z.string().optional(),
        useTestSandbox: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return VerificationEngineService.verifyPan(input, asAuthUser(ctx.user));
    }),

  initiateAadhaarVerification: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["StaffProfile", "User"]),
        entityId: z.string().min(1),
        rawAadhaar: z.string().min(12).max(14),
        consentId: z.string().min(1, "Consent ID is legally mandatory for Aadhaar verification"),
        declaredName: z.string().optional(),
        offlineSignatureToken: z.string().optional(),
        useTestSandbox: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return VerificationEngineService.verifyAadhaar(input, asAuthUser(ctx.user));
    }),

  initiateBankVerification: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["StaffProfile", "Vendor", "CorporatePartner"]),
        entityId: z.string().min(1),
        accountNumber: z.string().min(6).max(20),
        ifsc: z.string().min(11).max(11),
        declaredName: z.string().min(2),
        useTestSandbox: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return VerificationEngineService.verifyBankAccount(input, asAuthUser(ctx.user));
    }),

  initiateGstinVerification: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["Vendor", "CorporatePartner", "Franchise"]),
        entityId: z.string().min(1),
        gstin: z.string().min(15).max(15),
        declaredLegalName: z.string().optional(),
        isExempt: z.boolean().optional(),
        exemptionReason: z.string().optional(),
        useTestSandbox: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return VerificationEngineService.verifyGstin(input, asAuthUser(ctx.user));
    }),

  // ==========================================
  // MANUAL REVIEW & GOVERNANCE
  // ==========================================
  manualReview: protectedProcedure
    .input(
      z.object({
        recordId: z.string().min(1),
        decision: z.enum(["APPROVE", "REJECT"]),
        reason: z.string().min(10, "Minimum 10 characters required for manual review justification"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = asAuthUser(ctx.user);
      const authorizedRoles = [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
      ];
      if (!authorizedRoles.includes(user.roleCode as UserRoleCode)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators and directors can execute manual statutory KYC reviews.",
        });
      }
      return VerificationEngineService.manualReview(input, user);
    }),

  // ==========================================
  // COMPLIANCE GUARD CHECKS
  // ==========================================
  checkPayoutEligibility: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["StaffProfile", "Vendor", "CorporatePartner"]),
        entityId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      return VerificationEngineService.checkPayoutEligibility(input.entityType, input.entityId);
    }),
});
