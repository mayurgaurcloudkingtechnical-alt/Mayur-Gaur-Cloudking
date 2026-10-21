# SLG SKILLVERSE — Master Implementation Plan

See [`docs/skillverse/PROGRESS.md`](./PROGRESS.md) for the live milestone tracker and feature classifications.

## Phase Breakdown

### Phase 1: Foundation, Brand, Subdomain & 31 Public Pages — **COMPLETED (`1ad1dec`)**
- Brand identity (`SLG SKILLVERSE — Powered by SoftLab Global`), blue-green design tokens, and SoftLab Global emblem (`/images/logo.png`).
- Host-aware subdomain routing (`skillverse.softlabglobal.com` -> `/skillverse/*`) in `src/middleware.ts` and `nginx.conf`.
- All 31 public pages: Home, About, All Courses, 14 Academic/Competitive/Tech Program pages, Packages & Fees, Admissions, Free Demo Class, Student Assessment, Contact, FAQs, Blog, 4 Legal/DPDP Policies, and 3 Role Logins.

### Phase 2: Admissions CRM, Fee Engine, Portals & Certificates — **COMPLETED (`1ad1dec` / `77aa61c`)**
- 5 Monthly Academic Packages, 9 Competitive Add-Ons, 24 Published Courses, and Initial Fee Rules.
- 11-Stage Admissions CRM with verifiable parent consent, honeypot, rate limiting, and duplicate detection.
- Student Portal, Family-Isolated Parent Portal (SHA-256 PIN verification), Teacher Attendance Desk, Admin/Finance/CMS Portal, and Public Certificate Verification (`/skillverse/verify/[certificateNumber]`).
- Dedicated `apps/skillverse/` venture workspace (`package.json`, `src/index.ts`, `public/brand-manifest.json`, `tests/verify-skillverse.ts`).

### Phase 3 (Stage 2): Real Database Persistence, Teacher Descriptive Grading, Webhook Verification & E2E QA — **COMPLETED**
1. **Real Persistence & Server-Side Status Enforcement**:
   - Upgraded `SkillverseService.upsertCourse` and `SkillverseService.upsertPackage` to merge partial edits safely without losing modules or inclusions, and enforce `PUBLISHED` / `DRAFT` / `ARCHIVED` filtering on the server via `SkillverseService.getPublicCatalogAndConfig()` and `/skillverse/[slug]`.
2. **Persistent Quiz Attempts & Faculty Descriptive Grading**:
   - Added `SKILLVERSE_QUIZ_ATTEMPT` storage (`submitAndPersistQuizAttempt`) and `gradeDescriptiveQuizAttempt` (`ACADEMIC_ROLES`) so descriptive responses remain `PENDING_TEACHER_REVIEW` until graded by authorized faculty.
3. **Batch Management & Parent Communication Preferences**:
   - Added `upsertBatch` (`ACADEMIC_ROLES`) and `updateParentCommunicationPreferences` (server-side family PIN verified).
4. **Payment Webhook & Idempotency**:
   - Added `/api/skillverse/payment/webhook` with HMAC-SHA256 `x-razorpay-signature` verification, duplicate webhook idempotency, and `payment.failed` status handling.
5. **11-Suite E2E & Database Persistence Verification**:
   - Expanded `apps/skillverse/tests/verify-skillverse.ts` to 11 suites testing real PostgreSQL persistence and end-to-end user journeys with automatic teardown.
