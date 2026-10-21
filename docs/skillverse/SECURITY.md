# SLG SKILLVERSE — Security, RBAC & DPDP Child Privacy Controls (Stage 2)

## 1. Server-Side Role-Based Access Control (RBAC)
- **Admin & Finance Operations (`saveCmsSettings`, `updateFeeRules`, `upsertPackage`, `issueCertificate`, `revokeCertificate`)**: Restricted server-side via `requireRoles` to `SUPER_ADMIN`, `DIRECTOR`, `ADMIN`, `MANAGER`, and `ACCOUNTANT`.
- **Admissions CRM (`updateEnquiryStage`)**: Restricted server-side to Admin roles plus `COUNSELOR` and `TELECALLER`.
- **Academic, Batch & Faculty Grading Operations (`markStudentAttendance`, `upsertCourse`, `upsertBatch`, `gradeDescriptiveQuizAttempt`)**: Restricted server-side to Admin roles plus `TRAINER`.
- **Parent Portal Isolation (`verifyParentPortalAccess`, `updateParentCommunicationPreferences`)**: Requires matching `enrollmentCode`, registered 10-digit `parentPhone`, and SHA-256 salted `accessPin` hash (`hashPin`). A parent can never query, view, or update another family's student record.

## 2. Child Safety & DPDP Compliance
- Mandatory verifiable parent/legal guardian consent checkbox and timestamp (`parentConsentAccepted` + `parentConsentTimestamp`) on all student enquiry, demo booking, and diagnostic assessment forms. Unconsented submissions are rejected server-side.
- Analytics events (`SKILLVERSE_ANALYTICS`) never store student names, phone numbers, email addresses, or assessment answers.
- Honeypot anti-bot field and per-phone sliding-window rate limiting (`checkSkillverseRateLimit`) + 24-hour duplicate detection protect public forms against spam floods.

## 3. Payment & Webhook Tamper Resistance
- Payment orders (`/api/skillverse/payment/create-order`) calculate payable amounts exclusively on the server using `SkillverseService.calculateTransparentFeeBreakdown`.
- Payment verification (`/api/skillverse/payment/verify`) and webhook processing (`/api/skillverse/payment/webhook`) verify HMAC-SHA256 signatures and enforce idempotency on `PAID` invoices.
