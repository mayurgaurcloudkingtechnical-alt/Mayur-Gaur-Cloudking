import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { GstTaxCategory, InvoiceItemType } from "@prisma/client";

export interface TaxLineInput {
  itemType: InvoiceItemType;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit?: string;
  ratePaise: number;
  discountPaise?: number;
  taxCategory?: GstTaxCategory;
  gstRate?: number; // e.g. 18.0
  isTaxInclusive?: boolean; // true = price entered includes GST; false = add GST on top
  exemptionReason?: string;
}

export interface CalculatedTaxLine {
  itemType: InvoiceItemType;
  description: string;
  hsnSacCode: string;
  quantity: number;
  unit: string;
  ratePaise: number;
  discountPaise: number;
  taxCategory: GstTaxCategory;
  isTaxInclusive: boolean;
  exemptionReason?: string;
  taxableAmountPaise: number;
  gstRate: number;
  cgstRate: number;
  cgstAmountPaise: number;
  sgstRate: number;
  sgstAmountPaise: number;
  igstRate: number;
  igstAmountPaise: number;
  totalTaxPaise: number;
  totalAmountPaise: number;
  isRcm: boolean;
}

export interface GstCalculationResult {
  companyStateCode: string;
  placeOfSupplyStateCode: string;
  isInterState: boolean;
  subtotalPaise: number;
  discountPaise: number;
  taxableAmountPaise: number;
  cgstAmountPaise: number;
  sgstAmountPaise: number;
  igstAmountPaise: number;
  totalTaxPaise: number;
  roundOffPaise: number;
  grandTotalPaise: number;
  rcmTaxPaise: number;
  items: CalculatedTaxLine[];
}

export class CentralGstTaxEngine {
  public static readonly DEFAULT_COMPANY_STATE_CODE = "09"; // Uttar Pradesh
  public static readonly DEFAULT_COMPANY_STATE = "Uttar Pradesh";
  public static readonly DEFAULT_COMPANY_GSTIN = "09AAECS8901L1Z9";
  public static readonly DEFAULT_GST_RATE = 18.0;

  /**
   * Authoritative Master HSN/SAC Classification
   */
  public static readonly SAC_MASTER: Record<
    string,
    { description: string; defaultRate: number; defaultCategory: GstTaxCategory; defaultItemType: InvoiceItemType }
  > = {
    "999293": {
      description: "Commercial Training & Coaching Services",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.COURSE_TUITION,
    },
    "999294": {
      description: "Higher Education Degree Services",
      defaultRate: 0.0,
      defaultCategory: GstTaxCategory.EXEMPT,
      defaultItemType: InvoiceItemType.COURSE_TUITION,
    },
    "998313": {
      description: "IT Infrastructure and Network Management",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.IT_INSTALLATION,
    },
    "998314": {
      description: "IT Consulting and Software Development",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.CONSULTING_SERVICES,
    },
    "998512": {
      description: "Corporate Staffing and Recruitment Services",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.PLACEMENT_RECRUITMENT,
    },
    "998713": {
      description: "Maintenance and Repair / AMC Services",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.AMC_MAINTENANCE,
    },
    "998399": {
      description: "Franchise Royalty and Licensing Services",
      defaultRate: 18.0,
      defaultCategory: GstTaxCategory.STANDARD_TAXABLE,
      defaultItemType: InvoiceItemType.FRANCHISE_FEE,
    },
  };

  /**
   * Resolves effective GST rate based on Tax Category
   */
  public static resolveEffectiveRate(
    category: GstTaxCategory,
    customRate?: number,
    hsnSacCode?: string
  ): { rate: number; isRcm: boolean } {
    switch (category) {
      case GstTaxCategory.EXEMPT:
      case GstTaxCategory.NIL_RATED:
      case GstTaxCategory.ZERO_RATED:
        return { rate: 0.0, isRcm: false };

      case GstTaxCategory.REVERSE_CHARGE:
        return { rate: typeof customRate === "number" ? customRate : this.DEFAULT_GST_RATE, isRcm: true };

      case GstTaxCategory.APPROVED_SPECIAL_RATE:
        if (typeof customRate !== "number" || customRate < 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Special GST rate requires an explicitly approved non-negative percentage.",
          });
        }
        return { rate: customRate, isRcm: false };

      case GstTaxCategory.STANDARD_TAXABLE:
      default: {
        if (typeof customRate === "number") return { rate: customRate, isRcm: false };
        if (hsnSacCode && this.SAC_MASTER[hsnSacCode]) {
          return { rate: this.SAC_MASTER[hsnSacCode].defaultRate, isRcm: false };
        }
        return { rate: this.DEFAULT_GST_RATE, isRcm: false };
      }
    }
  }

  /**
   * Pure mathematical statutory calculation supporting dual-pricing (inclusive vs exclusive)
   * and intra-state (CGST+SGST) vs inter-state (IGST) apportionment.
   */
  public static calculateTax(params: {
    placeOfSupplyStateCode: string;
    companyStateCode?: string;
    items: TaxLineInput[];
  }): GstCalculationResult {
    const compCode = (params.companyStateCode || this.DEFAULT_COMPANY_STATE_CODE).trim().padStart(2, "0");
    const custCode = (params.placeOfSupplyStateCode || this.DEFAULT_COMPANY_STATE_CODE).trim().padStart(2, "0");
    const isInterState = compCode !== custCode;

    let subtotalPaise = 0;
    let discountPaise = 0;
    let taxableAmountPaise = 0;
    let cgstAmountPaise = 0;
    let sgstAmountPaise = 0;
    let igstAmountPaise = 0;
    let rcmTaxPaise = 0;

    const calculatedItems: CalculatedTaxLine[] = params.items.map((item) => {
      const category = item.taxCategory || GstTaxCategory.STANDARD_TAXABLE;
      const { rate: effectiveRate, isRcm } = this.resolveEffectiveRate(category, item.gstRate, item.hsnSacCode);

      const qty = Math.max(0.01, item.quantity || 1);
      const grossPaise = Math.round(qty * item.ratePaise);
      const discPaise = Math.min(grossPaise, Math.round(item.discountPaise || 0));
      const netEnteredPaise = Math.max(0, grossPaise - discPaise);

      subtotalPaise += grossPaise;
      discountPaise += discPaise;

      let lineTaxablePaise = 0;
      let lineTotalTaxPaise = 0;
      let lineTotalPaise = 0;

      if (effectiveRate === 0) {
        // Zero tax: Exempt, Nil-rated, or Zero-rated
        lineTaxablePaise = netEnteredPaise;
        lineTotalTaxPaise = 0;
        lineTotalPaise = netEnteredPaise;
      } else if (item.isTaxInclusive) {
        // Tax Inclusive: Extract tax component: Taxable = Gross / (1 + Rate / 100)
        lineTaxablePaise = Math.round((netEnteredPaise * 100) / (100 + effectiveRate));
        lineTotalTaxPaise = netEnteredPaise - lineTaxablePaise;
        lineTotalPaise = netEnteredPaise;
      } else {
        // Tax Exclusive: Add tax on top: Tax = Taxable * Rate / 100
        lineTaxablePaise = netEnteredPaise;
        lineTotalTaxPaise = Math.round((lineTaxablePaise * effectiveRate) / 100);
        lineTotalPaise = lineTaxablePaise + lineTotalTaxPaise;
      }

      taxableAmountPaise += lineTaxablePaise;

      let cgstRate = 0;
      let cgstPaise = 0;
      let sgstRate = 0;
      let sgstPaise = 0;
      let igstRate = 0;
      let igstPaise = 0;

      if (isInterState) {
        igstRate = effectiveRate;
        igstPaise = lineTotalTaxPaise;
        if (!isRcm) {
          igstAmountPaise += igstPaise;
        } else {
          rcmTaxPaise += igstPaise;
        }
      } else {
        cgstRate = effectiveRate / 2;
        sgstRate = effectiveRate / 2;
        cgstPaise = Math.round(lineTotalTaxPaise / 2);
        sgstPaise = lineTotalTaxPaise - cgstPaise; // Exact remainder prevents 1-paisa rounding divergence
        if (!isRcm) {
          cgstAmountPaise += cgstPaise;
          sgstAmountPaise += sgstPaise;
        } else {
          rcmTaxPaise += lineTotalTaxPaise;
        }
      }

      return {
        itemType: item.itemType,
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: qty,
        unit: item.unit || "NOS",
        ratePaise: item.ratePaise,
        discountPaise: discPaise,
        taxCategory: category,
        isTaxInclusive: Boolean(item.isTaxInclusive),
        exemptionReason: item.exemptionReason,
        taxableAmountPaise: lineTaxablePaise,
        gstRate: effectiveRate,
        cgstRate,
        cgstAmountPaise: cgstPaise,
        sgstRate,
        sgstAmountPaise: sgstPaise,
        igstRate,
        igstAmountPaise: igstPaise,
        totalTaxPaise: lineTotalTaxPaise,
        totalAmountPaise: lineTotalPaise,
        isRcm,
      };
    });

    const totalTaxPaise = cgstAmountPaise + sgstAmountPaise + igstAmountPaise;
    const exactGrandTotal = taxableAmountPaise + totalTaxPaise;

    // Round off to nearest Rupee (100 Paise)
    const roundedGrandTotal = Math.round(exactGrandTotal / 100) * 100;
    const roundOffPaise = roundedGrandTotal - exactGrandTotal;

    return {
      companyStateCode: compCode,
      placeOfSupplyStateCode: custCode,
      isInterState,
      subtotalPaise,
      discountPaise,
      taxableAmountPaise,
      cgstAmountPaise,
      sgstAmountPaise,
      igstAmountPaise,
      totalTaxPaise,
      roundOffPaise,
      grandTotalPaise: roundedGrandTotal,
      rcmTaxPaise,
      items: calculatedItems,
    };
  }

  /**
   * Helper to decompose a single gross or net fee into its statutory GST components
   */
  public static decomposeFee(params: {
    amountPaise: number;
    isTaxInclusive: boolean;
    placeOfSupplyStateCode?: string;
    taxCategory?: GstTaxCategory;
    gstRate?: number;
    hsnSacCode?: string;
  }) {
    const calculation = this.calculateTax({
      placeOfSupplyStateCode: params.placeOfSupplyStateCode || this.DEFAULT_COMPANY_STATE_CODE,
      items: [
        {
          itemType: InvoiceItemType.COURSE_TUITION,
          description: "Course Tuition & Educational Services",
          hsnSacCode: params.hsnSacCode || "999293",
          quantity: 1,
          ratePaise: params.amountPaise,
          discountPaise: 0,
          isTaxInclusive: params.isTaxInclusive,
          taxCategory: params.taxCategory || GstTaxCategory.STANDARD_TAXABLE,
          gstRate: params.gstRate,
        },
      ],
    });

    const item = calculation.items[0];
    return {
      taxableAmountPaise: item.taxableAmountPaise,
      totalTaxPaise: item.totalTaxPaise,
      cgstAmountPaise: item.cgstAmountPaise,
      sgstAmountPaise: item.sgstAmountPaise,
      igstAmountPaise: item.igstAmountPaise,
      grandTotalPaise: calculation.grandTotalPaise,
      isInterState: calculation.isInterState,
      gstRate: item.gstRate,
    };
  }
}
