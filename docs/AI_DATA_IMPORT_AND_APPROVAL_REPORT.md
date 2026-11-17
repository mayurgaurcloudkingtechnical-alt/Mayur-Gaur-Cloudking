# AI Data Import & Controlled Approval Report

## 1. Multi-Format AI Smart Capture (`POST /api/enterprise-data`)
- **Supported Formats:** `.xlsx` (parsed via `exceljs`), `.csv`, `.txt`, `.json`, `.vcf` (vCard), plus raw pasted text (WhatsApp/email dumps).
- **AI + Deterministic Extraction:** Uses `GEMINI_API_KEY` (`gemini-2.0-flash`) when present for unstructured text, with deterministic regex/column-header fallback so imports work reliably even without external AI keys.
- **Record Type Routing:** Supports `LEAD` (staged as `LeadStatus.ON_HOLD`), `VENDOR` (`isActive: false`), and `PARTNER` (`isActive: false`) without auto-creating admissions, payments, or invoices.
- **Duplicate Protection:** Checks existing `Lead`, `Vendor`, and `CorporatePartner` records by normalized 10-digit phone and email before staging, reporting `duplicateCount` and skipping duplicates.
- **Batch & Audit Tracking:** Creates `LeadImportBatch` and `AuditLog` (`ENTERPRISE_AI_DATA_IMPORT`) for every import.

## 2. Controlled Approval & Distribution Workflow (`PATCH /api/enterprise-data`)
- **Stage 1 (`ON_HOLD`):** Imported leads remain invisible to unapproved distribution until a Manager, Director, Admin, or Super Admin reviews them.
- **Actions:**
  - `APPROVE`: Transitions selected leads to `LeadStatus.NEW` + logs `DATA_HUB_APPROVE_LEADS` in `AuditLog`.
  - `REJECT`: Transitions selected leads to `LeadStatus.LOST` + logs `DATA_HUB_REJECT_LEADS` in `AuditLog`.
  - `DISTRIBUTE`: Assigns selected leads to a specific staff member or round-robins across active `COUNSELOR` / `TELECALLER` staff, sets `assignedToId` + role-specific assignee fields, creates `LeadActivity` (`activityType: "ASSIGNED"`), and logs `DATA_HUB_DISTRIBUTE_LEADS` in `AuditLog`.
