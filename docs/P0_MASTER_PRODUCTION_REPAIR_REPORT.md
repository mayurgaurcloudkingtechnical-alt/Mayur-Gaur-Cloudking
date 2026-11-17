# SoftLab Global — Master P0 Production Repair & Reliability Report

**Date:** `2026-11-16`  
**Production URL:** `https://lms.softlabglobal.com`  
**Pre-Repair Database Backup:** `/root/backups/softlab_db_pre_p0_20261116.sql.gz` (`5.1M` verified)  
**Commits:** `435a36f` (P0 repairs), `266aa71` (phone uniqueness guard)

## 1. Root Cause of Staff Onboarding Failure (`SLG-EMP-2026-0015`)
- **Forensic DB Evidence:** `AuditLog` (`2026-11-16T07:01:27.302Z`) recorded `STAFF_ONBOARDED` for `SLG-EMP-2026-0015` (`softlabglobal9@gmail.com`, `Head Trainer`, `TRAINER`, `TRAINING`), and `NotificationDeliveryLog` recorded `SENT` at `07:01:27.707Z`. However, both `User` and `StaffProfile` were subsequently absent from the live database, `StaffOnboardingService.generateEmployeeId()` used `db.staffProfile.count() + 1` (causing duplicate ID collisions when staff profiles were deleted), `TrainerProfile` used `create()` instead of `upsert()`, onboarding lacked an idempotency key, and shared helpline phone numbers could trigger `User.phone` unique constraint failures during repair.

## 2. Existing Head Trainer (`SLG-EMP-2026-0015`) Repair Evidence — `PASS`
- **Repaired via:** `POST /api/admin/credentials` (`REPAIR_ONBOARDING`)
- **Verified Records:**
  - `employeeId`: `SLG-EMP-2026-0015`
  - `userId`: `cmwizyfj40002x7nq9z7iy5st` (`softlabglobal9@gmail.com`, `roleCode: TRAINER`, `status: ACTIVE`)
  - `staffId`: `cmwizyfnz0004x7nq7zaxduk5` (`Head Trainer`, `TRAINING`, `isActive: true`)
  - `TrainerProfile` + `StaffOnboardingChecklist` + `LeaveBalance` + `EncryptedTemporaryCredential` initialized.
- **Real Login Verification:** `POST /api/auth/callback/credentials` returned `HTTP 302`, `sessionCookieIssued=true`, `location=https://lms.softlabglobal.com/trainer/dashboard`.
- **Directory Visibility:** `GET /api/admin/credentials?type=STAFF&search=SLG-EMP-2026-0015` returned `found=true`.

## 3. Staff Onboarding Permanent Fix
- Updated [staff-onboarding.service.ts](file:///D:/SOFTLAB-GLOBAL/src/server/services/staff-onboarding.service.ts):
  - Monotonic `generateEmployeeId()` scanning max numeric suffix for the current year.
  - Idempotency replay protection via `StaffOnboardingIdempotency`.
  - Atomic `db.$transaction` with `trainerProfile.upsert` and post-commit `EncryptedTemporaryCredential` storage.
  - Added `repairIncompleteOnboarding()` with shared-phone uniqueness guard.

## 4. Student Three-Email Admission Workflow Repair & Delivery Rules
- Updated [student-admission-notification.service.ts](file:///D:/SOFTLAB-GLOBAL/src/server/services/student-admission-notification.service.ts):
  - Replaced the single consolidated email and fabricated password fallback with **3 separate idempotent emails** tracked individually in `StudentAdmissionEmailLog`:
    1. `ADMISSION_CONFIRMATION` — `Admission Confirmed — Welcome to SOFTLAB GLOBAL`
    2. `LMS_CREDENTIALS` — `Your SOFTLAB GLOBAL LMS Login Credentials` (verified temporary password hashed directly onto `User.passwordHash` and stored in `EncryptedTemporaryCredential`)
    3. `WELCOME_ACTIVATION` — `Welcome to SOFTLAB GLOBAL — Your Learning Journey Starts Here`
  - Added `RETRY_ADMISSION_EMAIL` endpoint in `/api/admin/credentials` for safe individual email retries without creating duplicate student accounts.

## 5. Hierarchical Credential Authority Matrix & Password Security
- **Service:** [credential-security.service.ts](file:///D:/SOFTLAB-GLOBAL/src/server/services/credential-security.service.ts)
- **API & UI:** [route.ts](file:///D:/SOFTLAB-GLOBAL/src/app/api/admin/credentials/route.ts), [credential-management-panel.tsx](file:///D:/SOFTLAB-GLOBAL/src/components/admin/users/credential-management-panel.tsx) on `/admin/users`
- **Authority Rank:** `SUPER_ADMIN (100)` > `DIRECTOR (80)` > `ADMIN (70)` > `MANAGER (60)` > `HR (55)` > `ACCOUNTANT/PLACEMENT_OFFICER (35)` > `COUNSELOR/TRAINER (30)` > `TELECALLER (20)` > `STUDENT (10)`.
- **Security Policy:**
  - Permanent passwords are `bcrypt`-hashed and never retrievable.
  - Newly issued temporary credentials are encrypted at rest with `AES-256-GCM` (`EncryptedTemporaryCredential`), expire after 72h, and are audited (`CREDENTIAL_TEMP_REVEALED`, `CREDENTIAL_RESET_ISSUED`, `CREDENTIAL_REVOKED`, `CREDENTIAL_ACCESS_DENIED`).
- **Live Verification:** `COUNSELOR` blocked (`HTTP 403`), `HR` denied resetting `SUPER_ADMIN` (`HTTP 403`), `SUPER_ADMIN` reveal matched issued temp password (`HTTP 200`).

## 6. Independent Academic Content Engine Audit (54 SOFTLAB Courses) — `PASS`
- **Courses:** `54` (`providerType = SOFTLAB`, `deletedAt = null`)
- **Modules / Lessons:** `429` modules, `1,282` lessons
- **Verified Complete `LessonContent` (bodyHtml + objectives + practical + assignment + expectedOutput):** `1,282` / `1,282` (`100%`)
- **Published `PracticalLab` Records:** `1,282`
- **Published `CourseProjectPlan` Records:** `216` (12w: 2+1, 24w: 4+2, 52w: Sem 1 3+1 & Sem 2 4+2 = 10, proportionate for non-standard durations)
- **Active `QuestionBank` MCQs with Explanations:** `12,820`
- **Exams with Linked `ExamQuestion`s:** `108` / `108`
- **11-Sheet Excel Export (`GET /api/academic-engine?export=xlsx`):** `HTTP 200`, `411,427` bytes, `11` sheets verified via `exceljs`, `Course Master` has `55` rows (header + `54` courses).

## 7. Build, Deployment & Remaining Notes
- `next build` compiled `152/152` routes cleanly; PM2 `softlab-global`, `softlab-mail-api`, and `softlab-whatsapp` all `online`.
- **Note on New Student 3-Email Live Dispatch:** Code and `StudentAdmissionEmailLog` tracking are deployed; no synthetic student was permanently inserted into production admissions during verification to preserve clean production student/fee data.
