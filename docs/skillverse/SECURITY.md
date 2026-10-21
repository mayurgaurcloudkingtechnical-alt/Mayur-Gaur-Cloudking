# SLG SKILLVERSE — Security, RBAC & DPDP Child Privacy Controls

## 1. Role-Based Access Control (RBAC)
- **Admin & Finance Operations (`saveCmsSettings`, `updateFeeRules`, `issueCertificate`, `revokeCertificate`)**: Restricted server-side to `SUPER_ADMIN`, `DIRECTOR`, `ADMIN`, `MANAGER`, and `ACCOUNTANT`.
- **Admissions CRM (`updateEnquiryStage`)**: Restricted server-side to Admin roles plus `COUNSELOR` and `TELECALLER`.
- **Academic & Attendance Operations (`markStudentAttendance`)**: Restricted server-side to Admin roles plus `TRAINER`.
- **Parent Portal Isolation (`verifyParentPortalAccess`)**: Requires matching `enrollmentCode`, registered 10-digit `parentPhone`, and SHA-256 `accessPin` hash. A parent can never query or view another family's student record.

## 2. Child Safety & DPDP Compliance
- Mandatory verifiable parent/legal guardian consent checkbox and timestamp (`parentConsentAccepted` + `parentConsentTimestamp`) on all student enquiry, demo booking, and diagnostic assessment forms.
- Analytics events (`SKILLVERSE_ANALYTICS`) never store student names, phone numbers, email addresses, or assessment answers.
- Honeypot anti-bot field and per-phone rate limiting (`checkSkillverseRateLimit`) protect public forms against spam floods.
