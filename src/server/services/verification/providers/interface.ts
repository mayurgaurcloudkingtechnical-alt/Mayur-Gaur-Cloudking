import { VerificationStatus, VerificationType } from "@prisma/client";

export interface ProviderVerificationResponse {
  status: VerificationStatus;
  provider: string;
  referenceId: string;
  resultCode: string;
  verifiedName?: string;
  details?: Record<string, any>;
  failureReason?: string;
  expiryDate?: Date;
  requiresManualReview?: boolean;
  nameMatchScore?: number;
}

export interface IVerificationProvider {
  name: string;
  isConfigured(): boolean;

  verifyPan(pan: string, declaredName?: string): Promise<ProviderVerificationResponse>;
  
  verifyBankAccount(
    accountNumber: string,
    ifsc: string,
    declaredName: string
  ): Promise<ProviderVerificationResponse>;

  verifyGstin(
    gstin: string,
    declaredLegalName?: string
  ): Promise<ProviderVerificationResponse>;

  verifyAadhaar(
    maskedAadhaar: string,
    consentId: string,
    offlineSignatureToken?: string
  ): Promise<ProviderVerificationResponse>;
}
