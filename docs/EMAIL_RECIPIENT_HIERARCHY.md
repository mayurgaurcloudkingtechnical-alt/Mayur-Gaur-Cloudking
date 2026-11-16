# Email Recipient Hierarchy Report

**File:** `src/server/services/student-admission-notification.service.ts`  
**Commit:** `e811fcb`

## Implemented Dynamic Resolution
- Student-facing emails go to the student (`to: input.studentEmail`, `bcc: softlabglobal9@gmail.com`) without exposing internal staff CC lists.
- A separate internal management alert (`[Internal] New Admission Confirmed`) dynamically resolves:
  1. Admission creator (`createdById` → `User.email`)
  2. Immediate reporting manager (`staffProfile.reportingManagerId` → `User.email`)
  3. Active `HigherAuthorityRecipient` (`isActive: true, notifyEmail: true`)
  4. `softlabglobal9@gmail.com` (`EmailService.DEFAULT_MANAGEMENT_EMAIL`)
- Internal management alerts report 3-email delivery statuses and **never** include plaintext student passwords.
