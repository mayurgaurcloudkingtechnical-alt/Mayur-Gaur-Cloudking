# Unified GST Billing Engine Report

**Files:** `src/server/services/central-gst-tax-engine.service.ts`, `src/server/services/gst-billing.service.ts`

## Verified Capabilities
- Authoritative HSN/SAC Master classification (`999293` Commercial Training & Coaching Services at `18%` `STANDARD_TAXABLE`, `999294` Higher Education Degree Services with exempt classification support).
- Server-side calculation of `taxableAmountPaise`, `cgstAmountPaise`, `sgstAmountPaise`, `igstAmountPaise`, `roundOffPaise`, `grandTotalPaise`, `isTaxInclusive`, and `placeOfSupplyStateCode` (intra-state vs inter-state).
- Prevents double GST application and persists invoice-level tax snapshots inside PostgreSQL transactions (`GstBillingService.ensureAndSettleInvoiceForPayment`).
