/**
 * SOFTLAB GLOBAL — AUTHORITATIVE CENTRAL FEE CALCULATION SERVICE
 *
 * Implements canonical financial definitions:
 * 1. Base Course Fee: Actual course fee entered by the authorized Sales Team.
 * 2. Discount: Approved discount entered by the authorized Sales Team.
 * 3. Discounted Course Fee: Base Course Fee minus approved discount (Net Course Revenue).
 * 4. GST: Separately recorded applicable tax component.
 * 5. Global Certification Charges: Separately recorded charge.
 * 6. Kit Charges: Separately recorded charge.
 * 7. Other approved charges: Separately recorded individually, never hidden inside course fee.
 *
 * Calculation Formula:
 *   Base Course Fee - Approved Discount = Discounted Course Fee
 *   Discounted Course Fee + Applicable Additional Charges + Applicable Tax = Final Student Payable Amount
 *   Final Student Payable Amount - Verified Payments = Outstanding Balance
 *
 * All calculations use integer Paise (₹1 = 100 Paise) to guarantee precision without floating point errors.
 */

export interface FeeCalculationInput {
  baseCourseFee: number; // In Paise
  discountAmount?: number; // In Paise
  scholarshipAmount?: number; // In Paise
  globalCertificationFee?: number; // In Paise
  kitFee?: number; // In Paise
  otherCharges?: number; // In Paise
  applyGst?: boolean;
  gstRate?: number; // e.g. 0.18 for 18%
  paidAmount?: number; // In Paise
}

export interface FeeCalculationBreakdown {
  baseCourseFee: number; // Paise
  discountAmount: number; // Paise
  scholarshipAmount: number; // Paise
  totalDeductions: number; // Paise
  discountedCourseFee: number; // Paise (Net Course Fee)
  globalCertificationFee: number; // Paise
  kitFee: number; // Paise
  otherCharges: number; // Paise
  totalAdditionalCharges: number; // Paise
  taxableBase: number; // Paise
  gstRate: number; // e.g. 0.18
  gstRateLabel: string; // e.g. "18%" or "0%"
  gstAmount: number; // Paise
  cgstAmount: number; // Paise (9%)
  sgstAmount: number; // Paise (9%)
  finalPayable: number; // Paise (Final Student Payable Amount)
  paidAmount: number; // Paise (Verified Payments)
  pendingAmount: number; // Paise (Outstanding Balance)
}

export class CentralFeeCalculatorService {
  public static readonly DEFAULT_GST_RATE = 0.18; // 18% GST
  public static readonly SAC_CODE = "999293";
  public static readonly POLICY_VERSION = "2026.10-P0-STRICT";

  /**
   * Calculates the canonical fee breakdown based on actual inputs.
   */
  public static calculate(input: FeeCalculationInput): FeeCalculationBreakdown {
    const baseCourseFee = Math.max(0, Math.floor(input.baseCourseFee || 0));
    const discountAmount = Math.max(0, Math.floor(input.discountAmount || 0));
    const scholarshipAmount = Math.max(0, Math.floor(input.scholarshipAmount || 0));
    const totalDeductions = discountAmount + scholarshipAmount;

    // 1. Discounted Course Fee (Net Course Fee) = Base Course Fee - Deductions
    const discountedCourseFee = Math.max(0, baseCourseFee - totalDeductions);

    // 2. Additional Charges (separately recorded, never hidden in course fee)
    const globalCertificationFee = Math.max(0, Math.floor(input.globalCertificationFee || 0));
    const kitFee = Math.max(0, Math.floor(input.kitFee || 0));
    const otherCharges = Math.max(0, Math.floor(input.otherCharges || 0));
    const totalAdditionalCharges = globalCertificationFee + kitFee + otherCharges;

    // 3. Applicable Tax (GST)
    const applyGst = Boolean(input.applyGst);
    const gstRate = applyGst ? (input.gstRate ?? this.DEFAULT_GST_RATE) : 0;
    const taxableBase = discountedCourseFee + totalAdditionalCharges;

    let gstAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;

    if (applyGst && gstRate > 0) {
      gstAmount = Math.round(taxableBase * gstRate);
      cgstAmount = Math.round(taxableBase * (gstRate / 2));
      sgstAmount = gstAmount - cgstAmount; // Avoid penny rounding discrepancies
    }

    // 4. Final Student Payable Amount = Discounted Course Fee + Additional Charges + GST
    const finalPayable = discountedCourseFee + totalAdditionalCharges + gstAmount;

    // 5. Outstanding Balance = Final Payable - Verified Payments
    const paidAmount = Math.max(0, Math.floor(input.paidAmount || 0));
    const pendingAmount = Math.max(0, finalPayable - paidAmount);

    return {
      baseCourseFee,
      discountAmount,
      scholarshipAmount,
      totalDeductions,
      discountedCourseFee,
      globalCertificationFee,
      kitFee,
      otherCharges,
      totalAdditionalCharges,
      taxableBase,
      gstRate,
      gstRateLabel: applyGst ? `${Math.round(gstRate * 100)}%` : "0%",
      gstAmount,
      cgstAmount,
      sgstAmount,
      finalPayable,
      paidAmount,
      pendingAmount,
    };
  }

  /**
   * Helper to parse and extract fee components from a feeStructure row and its remarks JSON snapshot.
   */
  public static parseFeeStructureSnapshot(fee: {
    totalCourseFee: number;
    discountAmount: number;
    scholarshipAmount?: number;
    registrationFee?: number;
    softlabServiceFee?: number;
    otherCharges?: number;
    netPayableAmount: number;
    paidAmount: number;
    pendingAmount: number;
    remarks?: string | null;
  }): {
    baseCourseFee: number;
    discountAmount: number;
    discountedCourseFee: number;
    kitFee: number;
    globalCertificationFee: number;
    otherCharges: number;
    totalAdditionalCharges: number;
    gstAmount: number;
    finalPayable: number;
    paidAmount: number;
    pendingAmount: number;
    policyVersion: string;
    isHistoricalAdjusted: boolean;
  } {
    let parsedRemarks: any = {};
    try {
      if (fee.remarks && fee.remarks.trim().startsWith("{")) {
        parsedRemarks = JSON.parse(fee.remarks);
      }
    } catch {
      // Non-JSON remarks
    }

    const baseCourseFee = fee.totalCourseFee || 0;
    const discountAmount = fee.discountAmount || 0;
    const discountedCourseFee = Math.max(0, baseCourseFee - discountAmount);

    const kitFee = parsedRemarks.slgKitFee ?? fee.registrationFee ?? 0;
    const globalCertificationFee = parsedRemarks.globalCertificationFee ?? fee.softlabServiceFee ?? 0;
    const otherCharges = fee.otherCharges ?? 0;
    const totalAdditionalCharges = kitFee + globalCertificationFee + otherCharges;

    const gstAmount = parsedRemarks.gstAmount ?? parsedRemarks.gstTotal ?? 0;
    const finalPayable = fee.netPayableAmount || 0;
    const paidAmount = fee.paidAmount || 0;
    const pendingAmount = fee.pendingAmount || 0;

    const isHistoricalAdjusted = parsedRemarks.policyVersion === "V2_HISTORICAL_ADJUSTED" || (kitFee === 0 && globalCertificationFee === 0 && gstAmount === 0);
    const policyVersion = parsedRemarks.policyVersion || (isHistoricalAdjusted ? "V2_HISTORICAL_ADJUSTED" : "V1_LEGACY");

    return {
      baseCourseFee,
      discountAmount,
      discountedCourseFee,
      kitFee,
      globalCertificationFee,
      otherCharges,
      totalAdditionalCharges,
      gstAmount,
      finalPayable,
      paidAmount,
      pendingAmount,
      policyVersion,
      isHistoricalAdjusted,
    };
  }
}
