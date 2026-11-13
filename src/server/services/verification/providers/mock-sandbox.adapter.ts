import { IVerificationProvider, ProviderVerificationResponse } from "./interface";
import { VerificationStatus } from "@prisma/client";
import { StatutoryValidators } from "../validators";
import * as crypto from "crypto";

export class MockSandboxProviderAdapter implements IVerificationProvider {
  public name = "ISOLATED_TEST_SANDBOX";

  public isConfigured(): boolean {
    return true;
  }

  public async verifyPan(pan: string, declaredName?: string): Promise<ProviderVerificationResponse> {
    const panResult = StatutoryValidators.validatePan(pan);
    if (!panResult.isValid) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-PAN-FAIL-${Date.now()}`,
        resultCode: "INVALID_FORMAT",
        failureReason: panResult.error,
      };
    }

    const referenceId = `TEST-PAN-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const verifiedName = declaredName || "TEST ENTITY HOLDER";

    const nameMatch = StatutoryValidators.compareNames(declaredName || "", verifiedName);

    let status = VerificationStatus.VERIFIED;
    if (nameMatch.score < 60) {
      status = VerificationStatus.FAILED;
    } else if (nameMatch.score < 85) {
      status = VerificationStatus.MANUAL_REVIEW_REQUIRED;
    }

    return {
      status,
      provider: this.name,
      referenceId,
      resultCode: status === VerificationStatus.VERIFIED ? "SUCCESS" : "NAME_EVALUATED",
      verifiedName,
      nameMatchScore: nameMatch.score,
      details: {
        panNumber: panResult.panNumber,
        entityType: panResult.entityType,
        isIndividual: panResult.isIndividual,
      },
    };
  }

  public async verifyBankAccount(
    accountNumber: string,
    ifsc: string,
    declaredName: string
  ): Promise<ProviderVerificationResponse> {
    const ifscResult = StatutoryValidators.validateIfsc(ifsc);
    if (!ifscResult.isValid) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-BNK-FAIL-${Date.now()}`,
        resultCode: "INVALID_IFSC",
        failureReason: ifscResult.error,
      };
    }

    const digitsOnly = accountNumber.replace(/\D/g, "");
    if (digitsOnly.length < 8) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-BNK-FAIL-${Date.now()}`,
        resultCode: "INVALID_ACCOUNT_LENGTH",
        failureReason: "Account number must be at least 8 digits",
      };
    }

    // Special test case triggers
    if (accountNumber.endsWith("0000")) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-BNK-MISMATCH-${Date.now()}`,
        resultCode: "ACCOUNT_NOT_FOUND",
        failureReason: "Bank reported account does not exist or is frozen.",
      };
    }

    // Return realistic simulated bank response
    let verifiedName = declaredName || "ACCOUNT BENEFICIARY";
    if (accountNumber.startsWith("9876")) {
      // Simulated name variance triggering manual review
      verifiedName = `Different ${declaredName.split(" ")[0] || "User"} Account`;
    }

    const nameMatch = StatutoryValidators.compareNames(declaredName, verifiedName);

    let status = VerificationStatus.VERIFIED;
    if (nameMatch.score < 50) {
      status = VerificationStatus.FAILED;
    } else if (nameMatch.score < 85) {
      status = VerificationStatus.MANUAL_REVIEW_REQUIRED;
    }

    return {
      status,
      provider: this.name,
      referenceId: `TEST-BNK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      resultCode: "PENNY_DROP_SUCCESS",
      verifiedName,
      nameMatchScore: nameMatch.score,
      details: {
        bankName: ifscResult.bankName,
        bankCode: ifscResult.bankCode,
        accountLastFour: digitsOnly.slice(-4),
        branchName: "CIVIL LINES BRANCH",
        paymentReference: "UTR" + Date.now(),
      },
    };
  }

  public async verifyGstin(
    gstin: string,
    declaredLegalName?: string
  ): Promise<ProviderVerificationResponse> {
    const gstinResult = StatutoryValidators.validateGstin(gstin);
    if (!gstinResult.isValid) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-GST-FAIL-${Date.now()}`,
        resultCode: "INVALID_GSTIN",
        failureReason: gstinResult.error,
      };
    }

    const verifiedName = declaredLegalName || "SOFTLAB GLOBAL ENTERPRISE PRIVATE LIMITED";
    const nameMatch = StatutoryValidators.compareNames(declaredLegalName || "", verifiedName);

    return {
      status: VerificationStatus.VERIFIED,
      provider: this.name,
      referenceId: `TEST-GST-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      resultCode: "GSTN_ACTIVE",
      verifiedName,
      nameMatchScore: nameMatch.score,
      details: {
        gstin: gstinResult.gstin,
        stateName: gstinResult.stateName,
        stateCode: gstinResult.stateCode,
        extractedPan: gstinResult.extractedPan,
        taxpayerType: "Regular",
        registrationDate: "2020-04-01",
        status: "Active",
      },
    };
  }

  public async verifyAadhaar(
    maskedAadhaar: string,
    consentId: string,
    offlineSignatureToken?: string
  ): Promise<ProviderVerificationResponse> {
    if (!consentId) {
      return {
        status: VerificationStatus.FAILED,
        provider: this.name,
        referenceId: `TEST-UID-FAIL-${Date.now()}`,
        resultCode: "MISSING_CONSENT",
        failureReason: "Consent required",
      };
    }

    return {
      status: VerificationStatus.VERIFIED,
      provider: this.name,
      referenceId: `TEST-UID-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      resultCode: "OFFLINE_XML_VERIFIED",
      verifiedName: "VERIFIED CITIZEN",
      details: {
        maskedAadhaar,
        signatureVerified: true,
        verificationMethod: "DIGILOCKER_OFFLINE_XML",
      },
    };
  }
}
