# Enterprise Data Management Report

## 1. Centralized Data Directory (`/admin/data-hub`)
- **Page:** `src/app/(admin)/admin/data-hub/page.tsx`
- **UI Component:** `src/components/admin/data-hub/enterprise-data-hub.tsx`
- **API Endpoint:** `src/app/api/enterprise-data/route.ts`
- **Sidebar Entry:** Added `Enterprise Data Hub` in `src/components/common/sidebar.tsx` for `SUPER_ADMIN`, `DIRECTOR`, `ADMIN`, and `MANAGER` roles.

## 2. Exposed Directories & Live Production Counts
Verified against live production PostgreSQL via `GET /api/enterprise-data?tab=leads&page=1&limit=20`:
- **Complete Lead DB:** `76` leads
- **Pending Approval (`ON_HOLD`):** Live count tab
- **Approved Data:** Live count tab
- **Distributed Data:** Live count tab
- **Rejected Data (`LOST`):** Live count tab
- **Duplicate Records:** Filtered duplicate-tagged leads
- **Student DB:** `12` students (`StudentProfile` + `User`)
- **Staff Directory:** `21` non-student staff (`User`)
- **Higher Authority Directory:** `8` recipients (`HigherAuthorityRecipient`)
- **Vendor Directory:** `0` (`Vendor`)
- **Corporate / Recruitment Partners:** `0` (`CorporatePartner`)
- **Import History:** `LeadImportBatch` records
- **Data Activity Logs:** `AuditLog` records

## 3. Pagination, Search & Export
- Server-side pagination (`page`, `limit` up to `100`, `Previous` / `Next` controls).
- Search across name, phone, email, and city.
- Authorized **Export CSV** and **Export Excel (`.xlsx`)** for any active tab.
