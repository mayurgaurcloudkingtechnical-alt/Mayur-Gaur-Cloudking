# Enterprise Data Hub Synchronization Report

**Files:** `src/app/api/enterprise-data/route.ts`, `src/components/admin/data-hub/enterprise-data-hub.tsx`, `src/app/(admin)/admin/data-hub/page.tsx`

## Verified Capabilities
- Unified single CRM/LMS/ERP PostgreSQL source (no duplicate lead DB).
- Exposes 13 tabs (`leads: 76`, `students: 12`, `staff: 21`, `authorities: 8`, `pending_approval`, `approved`, `distributed`, `rejected`, `duplicates`, `vendors`, `partners`, `import_history`, `activity_logs`) with server-side pagination, search, CSV/Excel export, and `LeadImportBatch` tracking.
- Enforces `SUPER_ADMIN`, `DIRECTOR`, `ADMIN`, `MANAGER` RBAC (`403` for `COUNSELOR`).
