# SLG SKILLVERSE — Architecture & Isolation Design

## 1. Application Boundaries
- **Subdomain Routing (`src/middleware.ts`)**:
  - Requests arriving on `skillverse.softlabglobal.com` (or `?portal=skillverse`) are transparently rewritten via `NextResponse.rewrite` to `/skillverse/*`.
  - Requests on `www.softlabglobal.com` and `lms.softlabglobal.com` remain completely unaffected.
- **Route Group (`src/app/(skillverse)/skillverse/*`)**:
  - Uses its own layout (`SkillverseShell`) with the SoftLab Global emblem (`/images/logo.png`) and blue-green brand tokens.
- **API & tRPC Isolation**:
  - Dedicated tRPC sub-router: `trpc.skillverse.*` (`src/server/trpc/routers/skillverse.ts`).
  - Dedicated REST endpoints:
    - `/api/skillverse/health` (Readiness & provider status)
    - `/api/skillverse/payment/create-order` (Server-created Razorpay/Sandbox order)
    - `/api/skillverse/payment/verify` (HMAC-SHA256 signature verification)

## 2. Database Namespace Isolation
- All Skillverse records persist in PostgreSQL using the `SystemSetting` table (`system_settings`) under dedicated `SKILLVERSE_*` categories (`SKILLVERSE_CONFIG`, `SKILLVERSE_ENQUIRY`, `SKILLVERSE_STUDENT`, `SKILLVERSE_INVOICE`, `SKILLVERSE_CERTIFICATE`, `SKILLVERSE_ASSESSMENT`, `SKILLVERSE_NOTIFICATION`, `SKILLVERSE_ANALYTICS`, `SKILLVERSE_AUDIT`).
- **Zero Contamination**: Existing `Lead`, `Course`, `StudentProfile`, and `Payment` tables used by the main SoftLab Global LMS/CRM are never overwritten or polluted.
- **Verified Faculty**: Reads active trainer records read-only from `TrainerProfile` without fabricating profiles.
