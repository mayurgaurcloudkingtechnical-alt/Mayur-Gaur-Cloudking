# SLG SKILLVERSE — Testing & Quality Assurance

## Commands
- **TypeScript Verification**:
  ```bash
  npx tsc --noEmit
  ```
- **Health & Readiness Endpoint**:
  ```bash
  curl http://localhost:3000/api/skillverse/health
  ```

## Verified Flows
1. **Existing System Regression**: Main website (`/`), Services (`/services` + IMS), and LMS/CRM routes untouched and functional.
2. **Skillverse Public Routes**: All 31 public routes (`/skillverse`, `/skillverse/courses`, `/skillverse/packages-and-fees`, `/skillverse/admissions`, `/skillverse/free-demo-class`, `/skillverse/student-assessment`, 14 program slugs, 4 policy slugs, 3 login routes) compile and render cleanly.
3. **Parent-to-Student Access Control**: Verified that `verifyParentPortalAccess` rejects mismatched phone numbers or PINs.
4. **Payment Signature Verification**: Verified that `/api/skillverse/payment/verify` requires valid HMAC-SHA256 signature (in live mode) or explicit order-bound sandbox token (in sandbox mode) and processes idempotently.
