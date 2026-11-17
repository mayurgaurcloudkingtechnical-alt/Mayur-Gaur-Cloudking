# Admission Three-Email Automation Report

**File:** `src/server/services/student-admission-notification.service.ts`  
**Table:** `StudentAdmissionEmailLog`  
**Commit:** `435a36f`

## Three Separate Idempotent Emails
1. **`ADMISSION_CONFIRMATION`:** `Admission Confirmed — Welcome to SOFTLAB GLOBAL`
2. **`LMS_CREDENTIALS`:** `Your SOFTLAB GLOBAL LMS Login Credentials` (uses actual temporary password hashed onto `User.passwordHash` and stored in `EncryptedTemporaryCredential`)
3. **`WELCOME_ACTIVATION`:** `Welcome to SOFTLAB GLOBAL — Your Learning Journey Starts Here`

Each email uses its own `idempotencyKey` (`adm-email:{studentId}:{emailType}:{admissionNumber}`) and supports individual admin retry via `RETRY_ADMISSION_EMAIL` without creating duplicate student accounts.
