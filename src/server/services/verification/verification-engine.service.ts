import { db } from "@/server/db/client";
import {
  VerificationType,
  VerificationStatus,
  UserRoleCode,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { VerificationSecurityService } from "./security-masking.service";
import { StatutoryValidators } from "./validators";
import { IVerificationProvider, ProviderVerificationResponse } from "./providers/interface";
import { AuthorizedProviderAdapter } from "./providers/authorized-provider.adapter";
import { MockSandboxProviderAdapter } from "./providers/mock-sandbox.adapter";

export interface InitiatePanVerificationInput {
  entityType: "StaffProfile" | "Vendor" | "CorporatePartner" | "User" | "Franchise";
  entityId: string;
  panNumber: string;
  declaredName?: string;
  useTestSandbox?: boolean;
}

export interface RecordConsentInput {
  userId: string;
  purpose: string;
  termsVersion?: string;
  alternativeOffered?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface InitiateAadhaarVerificationInput {
  entityType: "StaffProfile" | "User";
  entityId: string;
  rawAadhaar: string;
  consentId: string;
  declaredName?: string;
  offlineSignatureToken?: string;
  useTestSandbox?: boolean;
}

export interface InitiateBankVerificationInput {
  entityType: "StaffProfile" | "Vendor" | "CorporatePartner";
  entityId: string;
  accountNumber: string;
  ifsc: string;
  declaredName: string;
  useTestSandbox?: boolean;
}

export interface InitiateGstinVerificationInput {
  entityType: "Vendor" | "CorporatePartner" | "Franchise";
  entityId: string;
  gstin: string;
  declaredLegalName?: string;
  isExempt?: boolean;
  exemptionReason?: string;
  useTestSandbox?: boolean;
}

export interface ManualReviewInput {
  recordId: string;
  decision: "APPROVE" | "REJECT";
  reason: string;
}

export class VerificationEngineService {
  private static defaultProvider: IVerificationProvider = new AuthorizedProviderAdapter();
  private static testProvider: IVerificationProvider = new MockSandboxProviderAdapter();

  private static getProvider(useTestSandbox?: boolean): IVerificationProvider {
    if (useTestSandbox || process.env.NODE_ENV === "test") {
      return this.testProvider;
    }
    return this.defaultProvider;
  }

  // =========================================================================
  // 1. CONSENT RECORDING (UIDAI / Legal Compliance)
  // =========================================================================
  public static async recordConsent(input: RecordConsentInput) {
    if (!input.userId || !input.purpose) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User ID and Purpose are mandatory to record statutory verification consent.",
      });
    }

    const consent = await db.verificationConsent.create({
      data: {
        userId: input.userId,
        purpose: input.purpose,
        termsVersion: input.termsVersion || "v1.0",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        alternativeOffered:
          input.alternativeOffered || "Offline physical document submission with HR/Compliance desk.",
        consentGiven: true,
        consentGivenAt: new Date(),
      },
    });

    return consent;
  }

  // =========================================================================
  // 2. PAN VERIFICATION
  // =========================================================================
  public static async verifyPan(
    input: InitiatePanVerificationInput,
    actor: AuthenticatedUser
  ) {
    const rawPan = input.panNumber?.trim().toUpperCase();
    const panResult = StatutoryValidators.validatePan(rawPan);

    const maskedTarget = VerificationSecurityService.maskPan(rawPan);
    const encryptedValue = VerificationSecurityService.encrypt(rawPan);

    // Invalidate prior latest record
    await db.verificationRecord.updateMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.PAN,
        isLatest: true,
      },
      data: { isLatest: false },
    });

    const provider = this.getProvider(input.useTestSandbox);
    let provRes: ProviderVerificationResponse;

    if (!panResult.isValid) {
      provRes = {
        status: VerificationStatus.FAILED,
        provider: "LOCAL_VALIDATOR",
        referenceId: `FMT-ERR-${Date.now()}`,
        resultCode: "INVALID_FORMAT",
        failureReason: panResult.error,
      };
    } else {
      provRes = await provider.verifyPan(rawPan, input.declaredName);
    }

    const record = await db.verificationRecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.PAN,
        status: provRes.status,
        provider: provRes.provider,
        referenceId: provRes.referenceId,
        resultCode: provRes.resultCode,
        maskedTarget,
        encryptedValue,
        declaredName: input.declaredName,
        verifiedName: provRes.verifiedName,
        nameMatchScore: provRes.nameMatchScore,
        failureReason: provRes.failureReason,
        sanitizedResponse: provRes.details ? (VerificationSecurityService.sanitizeForAudit(provRes.details) as any) : undefined,
        lastAttemptAt: new Date(),
        isLatest: true,
        auditLogs: {
          create: {
            actorId: actor.id,
            actorName: `${actor.firstName} ${actor.lastName}`.trim(),
            actorRole: actor.roleCode,
            newStatus: provRes.status,
            action: "PAN_VERIFICATION_INITIATED",
            details: {
              resultCode: provRes.resultCode,
              maskedTarget,
              provider: provRes.provider,
            },
          },
        },
      },
    });

    // Update entity profile flags
    const isVerified = provRes.status === VerificationStatus.VERIFIED;
    try {
      if (input.entityType === "StaffProfile") {
        await db.staffProfile.update({
          where: { id: input.entityId },
          data: {
            panNumber: rawPan,
            isPanVerified: isVerified,
            verificationStatus: isVerified ? VerificationStatus.VERIFIED : provRes.status,
          },
        });
      } else if (input.entityType === "Vendor") {
        await db.vendor.update({
          where: { id: input.entityId },
          data: {
            pan: rawPan,
            isPanVerified: isVerified,
            verificationStatus: isVerified ? VerificationStatus.VERIFIED : provRes.status,
          },
        });
      }
    } catch (e: any) {
      console.warn(`[Verification] Entity update skipped for ${input.entityType} (${input.entityId}):`, e?.message || e);
    }

    return record;
  }

  // =========================================================================
  // 3. AADHAAR VERIFICATION (Strict Verhoeff & UIDAI Compliant)
  // =========================================================================
  public static async verifyAadhaar(
    input: InitiateAadhaarVerificationInput,
    actor: AuthenticatedUser
  ) {
    if (!input.consentId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Aadhaar verification strictly requires prior documented consent ID.",
      });
    }

    const rawAadhaar = input.rawAadhaar?.replace(/\D/g, "");
    const aadhaarResult = StatutoryValidators.validateAadhaar(rawAadhaar);

    const maskedTarget = VerificationSecurityService.maskAadhaar(rawAadhaar);
    const encryptedValue = VerificationSecurityService.encrypt(rawAadhaar);

    // Invalidate prior latest record
    await db.verificationRecord.updateMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.AADHAAR,
        isLatest: true,
      },
      data: { isLatest: false },
    });

    const provider = this.getProvider(input.useTestSandbox);
    let provRes: ProviderVerificationResponse;

    if (!aadhaarResult.isValid) {
      provRes = {
        status: VerificationStatus.FAILED,
        provider: "VERHOEFF_VALIDATOR",
        referenceId: `FMT-ERR-${Date.now()}`,
        resultCode: "INVALID_CHECKSUM",
        failureReason: aadhaarResult.error,
      };
    } else {
      provRes = await provider.verifyAadhaar(
        maskedTarget,
        input.consentId,
        input.offlineSignatureToken
      );
    }

    const record = await db.verificationRecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.AADHAAR,
        status: provRes.status,
        provider: provRes.provider,
        referenceId: provRes.referenceId,
        resultCode: provRes.resultCode,
        maskedTarget,
        encryptedValue,
        declaredName: input.declaredName,
        verifiedName: provRes.verifiedName,
        failureReason: provRes.failureReason,
        consentId: input.consentId,
        sanitizedResponse: provRes.details ? (VerificationSecurityService.sanitizeForAudit(provRes.details) as any) : undefined,
        lastAttemptAt: new Date(),
        isLatest: true,
        auditLogs: {
          create: {
            actorId: actor.id,
            actorName: `${actor.firstName} ${actor.lastName}`.trim(),
            actorRole: actor.roleCode,
            newStatus: provRes.status,
            action: "AADHAAR_VERIFICATION_INITIATED",
            details: {
              resultCode: provRes.resultCode,
              maskedTarget,
              consentId: input.consentId,
            },
          },
        },
      },
    });

    if (input.entityType === "StaffProfile") {
      const isVerified = provRes.status === VerificationStatus.VERIFIED;
      try {
        await db.staffProfile.update({
          where: { id: input.entityId },
          data: {
            aadhaarMasked: maskedTarget,
            isAadhaarVerified: isVerified,
          },
        });
      } catch (e: any) {
        console.warn(`[Verification] Staff Aadhaar update skipped (${input.entityId}):`, e?.message || e);
      }
    }

    return record;
  }

  // =========================================================================
  // 4. BANK ACCOUNT VERIFICATION
  // =========================================================================
  public static async verifyBankAccount(
    input: InitiateBankVerificationInput,
    actor: AuthenticatedUser
  ) {
    const rawAcc = input.accountNumber?.trim();
    const rawIfsc = input.ifsc?.trim().toUpperCase();

    const ifscResult = StatutoryValidators.validateIfsc(rawIfsc);
    const maskedTarget = `${ifscResult.bankName} (${VerificationSecurityService.maskBankAccount(rawAcc)})`;
    const encryptedValue = VerificationSecurityService.encrypt(`${rawAcc}|${rawIfsc}`);

    await db.verificationRecord.updateMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.BANK_ACCOUNT,
        isLatest: true,
      },
      data: { isLatest: false },
    });

    const provider = this.getProvider(input.useTestSandbox);
    let provRes: ProviderVerificationResponse;

    if (!ifscResult.isValid) {
      provRes = {
        status: VerificationStatus.FAILED,
        provider: "LOCAL_VALIDATOR",
        referenceId: `IFSC-ERR-${Date.now()}`,
        resultCode: "INVALID_IFSC",
        failureReason: ifscResult.error,
      };
    } else {
      provRes = await provider.verifyBankAccount(rawAcc, rawIfsc, input.declaredName);
    }

    const record = await db.verificationRecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.BANK_ACCOUNT,
        status: provRes.status,
        provider: provRes.provider,
        referenceId: provRes.referenceId,
        resultCode: provRes.resultCode,
        maskedTarget,
        encryptedValue,
        declaredName: input.declaredName,
        verifiedName: provRes.verifiedName,
        nameMatchScore: provRes.nameMatchScore,
        failureReason: provRes.failureReason,
        sanitizedResponse: provRes.details ? (VerificationSecurityService.sanitizeForAudit(provRes.details) as any) : undefined,
        lastAttemptAt: new Date(),
        isLatest: true,
        auditLogs: {
          create: {
            actorId: actor.id,
            actorName: `${actor.firstName} ${actor.lastName}`.trim(),
            actorRole: actor.roleCode,
            newStatus: provRes.status,
            action: "BANK_ACCOUNT_VERIFICATION_INITIATED",
            details: {
              ifsc: rawIfsc,
              bankName: ifscResult.bankName,
              maskedAccount: VerificationSecurityService.maskBankAccount(rawAcc),
              resultCode: provRes.resultCode,
            },
          },
        },
      },
    });

    const isVerified = provRes.status === VerificationStatus.VERIFIED;
    try {
      if (input.entityType === "StaffProfile") {
        await db.staffProfile.update({
          where: { id: input.entityId },
          data: {
            bankAccountNumber: rawAcc,
            bankIfsc: rawIfsc,
            isBankVerified: isVerified,
          },
        });
      } else if (input.entityType === "Vendor") {
        await db.vendor.update({
          where: { id: input.entityId },
          data: {
            bankName: ifscResult.bankName,
            accountNumber: rawAcc,
            ifscCode: rawIfsc,
            isBankVerified: isVerified,
          },
        });
      }
    } catch (e: any) {
      console.warn(`[Verification] Bank entity update skipped (${input.entityType} ${input.entityId}):`, e?.message || e);
    }

    return record;
  }

  // =========================================================================
  // 5. GSTIN VERIFICATION
  // =========================================================================
  public static async verifyGstin(
    input: InitiateGstinVerificationInput,
    actor: AuthenticatedUser
  ) {
    if (input.isExempt) {
      // Record legally recorded exemption (NOT_APPLICABLE)
      const record = await db.verificationRecord.create({
        data: {
          entityType: input.entityType,
          entityId: input.entityId,
          verificationType: VerificationType.GSTIN,
          status: VerificationStatus.NOT_APPLICABLE,
          provider: "STATUTORY_RULE",
          referenceId: `EXEMPT-${Date.now()}`,
          resultCode: "GST_EXEMPT_DOCUMENTED",
          maskedTarget: "EXEMPT / NOT_APPLICABLE",
          failureReason: input.exemptionReason || "Entity turnover below statutory threshold or exempted institutional service.",
          isLatest: true,
          auditLogs: {
            create: {
              actorId: actor.id,
              actorName: `${actor.firstName} ${actor.lastName}`.trim(),
              actorRole: actor.roleCode,
              newStatus: VerificationStatus.NOT_APPLICABLE,
              action: "GSTIN_EXEMPTION_DOCUMENTED",
              details: { exemptionReason: input.exemptionReason },
            },
          },
        },
      });
      return record;
    }

    const rawGstin = input.gstin?.trim().toUpperCase();
    const gstinResult = StatutoryValidators.validateGstin(rawGstin);

    const maskedTarget = VerificationSecurityService.maskGstin(rawGstin);
    const encryptedValue = VerificationSecurityService.encrypt(rawGstin);

    await db.verificationRecord.updateMany({
      where: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.GSTIN,
        isLatest: true,
      },
      data: { isLatest: false },
    });

    const provider = this.getProvider(input.useTestSandbox);
    let provRes: ProviderVerificationResponse;

    if (!gstinResult.isValid) {
      provRes = {
        status: VerificationStatus.FAILED,
        provider: "MOD36_CHECKSUM_ENGINE",
        referenceId: `GST-ERR-${Date.now()}`,
        resultCode: "INVALID_CHECKSUM",
        failureReason: gstinResult.error,
      };
    } else {
      provRes = await provider.verifyGstin(rawGstin, input.declaredLegalName);
    }

    const record = await db.verificationRecord.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        verificationType: VerificationType.GSTIN,
        status: provRes.status,
        provider: provRes.provider,
        referenceId: provRes.referenceId,
        resultCode: provRes.resultCode,
        maskedTarget,
        encryptedValue,
        declaredName: input.declaredLegalName,
        verifiedName: provRes.verifiedName,
        failureReason: provRes.failureReason,
        sanitizedResponse: provRes.details ? (VerificationSecurityService.sanitizeForAudit(provRes.details) as any) : undefined,
        lastAttemptAt: new Date(),
        isLatest: true,
        auditLogs: {
          create: {
            actorId: actor.id,
            actorName: `${actor.firstName} ${actor.lastName}`.trim(),
            actorRole: actor.roleCode,
            newStatus: provRes.status,
            action: "GSTIN_VERIFICATION_INITIATED",
            details: {
              stateCode: gstinResult.stateCode,
              extractedPan: gstinResult.extractedPan,
              resultCode: provRes.resultCode,
            },
          },
        },
      },
    });

    const isVerified = provRes.status === VerificationStatus.VERIFIED;
    if (input.entityType === "Vendor") {
      try {
        await db.vendor.update({
          where: { id: input.entityId },
          data: {
            gstin: rawGstin,
            isGstinVerified: isVerified,
          },
        });
      } catch (e: any) {
        console.warn(`[Verification] Vendor GSTIN update skipped (${input.entityId}):`, e?.message || e);
      }
    }

    return record;
  }

  // =========================================================================
  // 6. MANUAL REVIEW WORKFLOW (Auditable Override)
  // =========================================================================
  public static async manualReview(
    input: ManualReviewInput,
    reviewer: AuthenticatedUser
  ) {
    if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN"].includes(reviewer.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only Super Admin, Director, or authorized Compliance Admin may perform manual identity reviews.",
      });
    }

    if (!input.reason || input.reason.trim().length < 10) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A comprehensive justification (minimum 10 characters) is required for manual review approval/rejection.",
      });
    }

    const record = await db.verificationRecord.findUnique({
      where: { id: input.recordId },
    });

    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Verification record not found." });
    }

    const newStatus =
      input.decision === "APPROVE"
        ? VerificationStatus.MANUALLY_REVIEWED
        : VerificationStatus.FAILED;

    const updated = await db.verificationRecord.update({
      where: { id: input.recordId },
      data: {
        status: newStatus,
        manualReviewerId: reviewer.id,
        manualReviewerName: `${reviewer.firstName} ${reviewer.lastName}`.trim(),
        manualReviewNotes: input.reason.trim(),
        manualReviewedAt: new Date(),
        auditLogs: {
          create: {
            actorId: reviewer.id,
            actorName: `${reviewer.firstName} ${reviewer.lastName}`.trim(),
            actorRole: reviewer.roleCode,
            previousStatus: record.status,
            newStatus,
            action: input.decision === "APPROVE" ? "MANUAL_REVIEW_APPROVED" : "MANUAL_REVIEW_REJECTED",
            details: {
              reviewNotes: input.reason.trim(),
              decision: input.decision,
            },
          },
        },
      },
    });

    // Synchronize entity profile state
    const isApproved = newStatus === VerificationStatus.MANUALLY_REVIEWED;
    try {
      if (record.entityType === "StaffProfile") {
        if (record.verificationType === VerificationType.BANK_ACCOUNT) {
          await db.staffProfile.update({
            where: { id: record.entityId },
            data: { isBankVerified: isApproved },
          });
        } else if (record.verificationType === VerificationType.PAN) {
          await db.staffProfile.update({
            where: { id: record.entityId },
            data: { isPanVerified: isApproved },
          });
        } else if (record.verificationType === VerificationType.AADHAAR) {
          await db.staffProfile.update({
            where: { id: record.entityId },
            data: { isAadhaarVerified: isApproved },
          });
        }
      } else if (record.entityType === "Vendor") {
        if (record.verificationType === VerificationType.BANK_ACCOUNT) {
          await db.vendor.update({
            where: { id: record.entityId },
            data: { isBankVerified: isApproved },
          });
        } else if (record.verificationType === VerificationType.GSTIN) {
          await db.vendor.update({
            where: { id: record.entityId },
            data: { isGstinVerified: isApproved },
          });
        } else if (record.verificationType === VerificationType.PAN) {
          await db.vendor.update({
            where: { id: record.entityId },
            data: { isPanVerified: isApproved },
          });
        }
      }
    } catch (e: any) {
      console.warn(`[Verification] Manual review entity update skipped (${record.entityType} ${record.entityId}):`, e?.message || e);
    }

    return updated;
  }

  // =========================================================================
  // 7. SENSITIVE VALUE MODIFICATION (Automatic Re-verification)
  // =========================================================================
  public static async reverifyOnChange(
    entityType: "StaffProfile" | "Vendor",
    entityId: string,
    fieldName: "pan" | "bank" | "aadhaar" | "gstin",
    actor: AuthenticatedUser
  ) {
    const typeMap: Record<string, VerificationType> = {
      pan: VerificationType.PAN,
      bank: VerificationType.BANK_ACCOUNT,
      aadhaar: VerificationType.AADHAAR,
      gstin: VerificationType.GSTIN,
    };

    const targetType = typeMap[fieldName];
    if (!targetType) return;

    await db.verificationRecord.updateMany({
      where: {
        entityType,
        entityId,
        verificationType: targetType,
        isLatest: true,
      },
      data: {
        isLatest: false,
        status: VerificationStatus.EXPIRED,
      },
    });

    // Reset profile flags
    if (entityType === "StaffProfile") {
      if (fieldName === "bank") await db.staffProfile.update({ where: { id: entityId }, data: { isBankVerified: false } });
      if (fieldName === "pan") await db.staffProfile.update({ where: { id: entityId }, data: { isPanVerified: false } });
      if (fieldName === "aadhaar") await db.staffProfile.update({ where: { id: entityId }, data: { isAadhaarVerified: false } });
    } else if (entityType === "Vendor") {
      if (fieldName === "bank") await db.vendor.update({ where: { id: entityId }, data: { isBankVerified: false } });
      if (fieldName === "gstin") await db.vendor.update({ where: { id: entityId }, data: { isGstinVerified: false } });
      if (fieldName === "pan") await db.vendor.update({ where: { id: entityId }, data: { isPanVerified: false } });
    }
  }

  // =========================================================================
  // 8. STATUTORY PAYOUT & FINANCIAL GUARD (Strict Compliance)
  // =========================================================================
  public static async checkPayoutEligibility(
    entityType: "StaffProfile" | "Vendor",
    entityId: string
  ): Promise<{ eligible: boolean; status: VerificationStatus; message: string }> {
    const record = await db.verificationRecord.findFirst({
      where: {
        entityType,
        entityId,
        verificationType: VerificationType.BANK_ACCOUNT,
        isLatest: true,
      },
    });

    if (!record) {
      return {
        eligible: false,
        status: VerificationStatus.NOT_STARTED,
        message: "Bank account has not initiated verification. Payout is strictly blocked.",
      };
    }

    const isEligible =
      record.status === VerificationStatus.VERIFIED ||
      record.status === VerificationStatus.MANUALLY_REVIEWED;

    return {
      eligible: isEligible,
      status: record.status,
      message: isEligible
        ? "Bank account verified and approved for automated payouts/payroll."
        : `Bank account status is ${record.status}. Payout blocked until verified or approved via manual review.`,
    };
  }

  // =========================================================================
  // 9. METRICS & AUDIT QUERIES
  // =========================================================================
  public static async getMetrics() {
    const totalRecords = await db.verificationRecord.count({ where: { isLatest: true } });
    const verified = await db.verificationRecord.count({
      where: { isLatest: true, status: { in: [VerificationStatus.VERIFIED, VerificationStatus.MANUALLY_REVIEWED] } },
    });
    const pending = await db.verificationRecord.count({
      where: {
        isLatest: true,
        status: { in: [VerificationStatus.PENDING_VERIFICATION, VerificationStatus.PENDING_CONFIGURATION, VerificationStatus.PENDING_CONSENT] },
      },
    });
    const failed = await db.verificationRecord.count({
      where: { isLatest: true, status: VerificationStatus.FAILED },
    });
    const manualReview = await db.verificationRecord.count({
      where: { isLatest: true, status: VerificationStatus.MANUAL_REVIEW_REQUIRED },
    });

    const byType = await db.verificationRecord.groupBy({
      by: ["verificationType"],
      where: { isLatest: true },
      _count: { id: true },
    });

    return {
      totalRecords,
      verified,
      pending,
      failed,
      manualReview,
      byType: byType.reduce((acc, curr) => {
        acc[curr.verificationType] = curr._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  public static async listRecords(filters: {
    verificationType?: VerificationType;
    status?: VerificationStatus;
    entityType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { isLatest: true };
    if (filters.verificationType) where.verificationType = filters.verificationType;
    if (filters.status) where.status = filters.status;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.search) {
      where.OR = [
        { declaredName: { contains: filters.search, mode: "insensitive" } },
        { verifiedName: { contains: filters.search, mode: "insensitive" } },
        { maskedTarget: { contains: filters.search, mode: "insensitive" } },
        { referenceId: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.verificationRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
      }),
      db.verificationRecord.count({ where }),
    ]);

    // Mask sensitive fields in output
    const sanitized = items.map((rec) => ({
      ...rec,
      encryptedValue: undefined, // Never expose raw encrypted token to UI
    }));

    return {
      items: sanitized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
