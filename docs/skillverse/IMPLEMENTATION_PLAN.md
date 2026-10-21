# SLG SKILLVERSE — Master Implementation Plan

See [`docs/skillverse/PROGRESS.md`](./PROGRESS.md) for the live milestone tracker.

## Phase Breakdown

### Phase 1: Foundation, Brand, Subdomain & 31 Public Pages — **COMPLETED (`1ad1dec`)**
- Brand identity (`SLG SKILLVERSE — Powered by SoftLab Global`), blue-green design tokens, and SoftLab Global emblem (`/images/logo.png`).
- Host-aware subdomain routing (`skillverse.softlabglobal.com` -> `/skillverse/*`) in `src/middleware.ts` and `nginx.conf`.
- All 31 public pages: Home, About, All Courses, 14 Academic/Competitive/Tech Program pages, Packages & Fees, Admissions, Free Demo Class, Student Assessment, Contact, FAQs, Blog, 4 Legal/DPDP Policies, and 3 Role Logins.

### Phase 2: Admissions CRM, Fee Engine, Portals & Certificates — **COMPLETED (`1ad1dec`)**
- 5 Monthly Academic Packages, 9 Competitive Add-Ons, 24 Published Courses, and Initial Fee Rules.
- 11-Stage Admissions CRM with verifiable parent consent, honeypot, rate limiting, and duplicate detection.
- Student Portal, Family-Isolated Parent Portal (SHA-256 PIN verification), Teacher Attendance Desk, Admin/Finance/CMS Portal, and Public Certificate Verification (`/skillverse/verify/[certificateNumber]`).
- Server-side payment order creation & HMAC-SHA256 signature verification.

### Phase 3: Venture Workspace (`apps/skillverse/`), Full Admin Course/Batch/Quiz CRUD & Automated Test Suite — **READY FOR EXECUTION**
1. Initialize `apps/skillverse/` (`package.json`, `src/`, `public/`, `tests/`) without duplicating or moving existing Next.js route group files.
2. Add full UI CRUD in the Admin & Teacher Portals for creating/editing/archiving courses, packages, batches, lessons, assignments, and timed quizzes (MCQ, MSQ, Descriptive).
3. Add interactive timed quiz attempts and assignment submission inside the Student Portal with teacher evaluation.
4. Execute isolated automated verification suite in `apps/skillverse/tests/verify-skillverse.ts` and update `docs/skillverse/PROGRESS.md`.
