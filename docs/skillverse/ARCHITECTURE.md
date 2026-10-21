# SLG SKILLVERSE — Architecture & Venture Boundaries

## 1. Repository & Monorepo Context
The SoftLab Global repository is a Next.js 14.2.15 + Prisma 5.20.0 + PostgreSQL 16 + tRPC v11 + NextAuth v5 application deployed via `railway.json` and fronted by `nginx.conf`.
Isolated ventures in this repository use a two-tier structure:
1. **`apps/skillverse/`** — Venture workspace manifest (`package.json`), isolated automated test suite (`apps/skillverse/tests/verify-skillverse.ts`), venture brand manifest (`apps/skillverse/public/brand-manifest.json`), and modular exports (`apps/skillverse/src/index.ts`).
2. **Next.js App Router Route Group (`src/app/(skillverse)/skillverse/*`)** — Served directly by the unified Next.js server and mapped to `https://skillverse.softlabglobal.com` via `src/middleware.ts` and `nginx.conf`.

## 2. Subdomain & Routing Isolation
- **Target Hostname:** `https://skillverse.softlabglobal.com`
- **Middleware (`src/middleware.ts`)**:
  - Inspects `req.headers.get("host")` (or `?portal=skillverse`).
  - When `host.startsWith("skillverse.")`, rewrites incoming paths (`/`, `/courses`, `/packages-and-fees`, `/admissions`, `/student-login`, `/parent-login`, `/staff-login`, etc.) to `/skillverse/*`.
  - Requests to `www.softlabglobal.com`, `lms.softlabglobal.com`, and `api.softlabglobal.com` bypass Skillverse rewriting completely.

## 3. Backend, API & Database Isolation
- **tRPC Router:** `src/server/trpc/routers/skillverse.ts` (`trpc.skillverse.*`).
  - Public procedures: `getPublicCatalog` (enforces server-side `PUBLISHED` course filtering), `calculateFeeBreakdown`, `submitAdmissionEnquiry`, `submitDiagnosticAssessment`, `verifyParentPortalAccess`, `updateParentCommunicationPreferences`, `getStudentPortalData`, `verifyCertificate`, `evaluateQuizAttempt`.
  - Role-protected procedures: `getAdminDashboardData`, `updateEnquiryStage`, `markStudentAttendance`, `saveCmsSettings`, `updateFeeRules`, `issueCertificate`, `revokeCertificate`, `upsertCourse`, `upsertPackage`, `upsertBatch`, `gradeDescriptiveQuizAttempt`.
- **Service Layer:** `src/server/services/skillverse.service.ts`.
- **REST Endpoints:**
  - `/api/skillverse/health` (Readiness & provider status)
  - `/api/skillverse/payment/create-order` (Server-created Razorpay/Sandbox orders)
  - `/api/skillverse/payment/verify` (HMAC-SHA256 payment verification & receipt generation)
  - `/api/skillverse/payment/webhook` (HMAC-SHA256 `x-razorpay-signature` webhook verification, idempotency, and failed-payment handling)
- **PostgreSQL Namespace (`system_settings`)**:
  - Uses dedicated `category` values prefixed with `SKILLVERSE_`:
    - `SKILLVERSE_CONFIG` (`SKILLVERSE_CATALOG_COURSES_V1`, `SKILLVERSE_CATALOG_PACKAGES_V1`, `SKILLVERSE_CATALOG_ADDONS_V1`, `SKILLVERSE_FEE_RULES_V1`, `SKILLVERSE_CMS_SETTINGS_V1`, `SKILLVERSE_BATCHES_V1`)
    - `SKILLVERSE_ENQUIRY` (`SV_ENQ_<referenceNumber>`)
    - `SKILLVERSE_STUDENT` (`SV_STU_<enrollmentCode>`)
    - `SKILLVERSE_INVOICE` (`SV_INV_<invoiceNumber>`)
    - `SKILLVERSE_CERTIFICATE` (`SV_CERT_<certificateNumber>`)
    - `SKILLVERSE_ASSESSMENT` (`SV_ASSESS_<attemptId>`)
    - `SKILLVERSE_QUIZ_ATTEMPT` (`SV_QUIZ_<attemptId>`)
    - `SKILLVERSE_NOTIFICATION`, `SKILLVERSE_ANALYTICS`, `SKILLVERSE_AUDIT`
  - Zero destructive schema migrations; zero pollution of existing `Lead`, `Course`, `Enrollment`, or `StudentProfile` tables.
