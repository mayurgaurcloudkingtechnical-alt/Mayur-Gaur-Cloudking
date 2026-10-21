# SLG SKILLVERSE — Testing & Quality Assurance (Stage 2)

## 1. Automated Verification Commands
- **Stage 2 Skillverse Automated Verification & E2E Persistence Suite (11/11 Suites)**:
  ```bash
  npx tsx apps/skillverse/tests/verify-skillverse.ts
  ```
- **TypeScript Verification**:
  ```bash
  node ./node_modules/typescript/bin/tsc --noEmit --pretty false
  ```
- **Health & Readiness Endpoint**:
  ```bash
  curl http://localhost:3000/api/skillverse/health
  ```

## 2. Stage 2 Verified Test Suites (`11/11` Passed)
1. **Suite 1 — Brand Governance & Subdomain Identity**: Verifies `SLG SKILLVERSE — Powered by SoftLab Global`, hostname constants, and color palette (`#071630` Navy, `#0052CC` Royal Blue).
2. **Suite 2 — Monthly Academic Packages**: Verifies all 5 packages (`₹1,499`, `₹2,499`, `₹3,499`, `₹2,999`, `₹3,999`) and exact 12-month undiscounted totals (`monthlyPriceInr * 12`).
3. **Suite 3 — Competitive Add-Ons & Initial Fee Rules**: Verifies 9 competitive tracks and one-time fee rules (`₹500` Admission + `₹500` Learning Kit + `₹0` Free Assessment + `₹0` Free Demo).
4. **Suite 4 — Complete Course Catalogue**: Verifies all 24 courses across School Foundation (Classes 8–10), Senior Secondary (Classes 11–12), IIT-JEE, NEET-UG, Olympiad/CUET/NDA, AI/Coding/Robotics, and Spoken English.
5. **Suite 5 — Transparent Fee Calculation Engine**: Verifies optional add-ons are never silently bundled into base package fees.
6. **Suite 6 — Multi-Type Quiz Evaluation**: Verifies `MCQ` (single choice), `MSQ` (order-insensitive multi-select), and `DESCRIPTIVE` (`PENDING_TEACHER_REVIEW` status).
7. **Suite 7 — Parent Portal SHA-256 PIN Hashing**: Verifies deterministic salted SHA-256 PIN hashing.
8. **Suite 8 — Endpoint Rate Limiter**: Verifies per-identifier sliding window rate limiting.
9. **Suite 9 — Free Diagnostic Assessment Bank**: Verifies 5-subject diagnostic question bank and explanations.
10. **Suite 10 — Real Database Persistence & Server-Side Status Enforcement**:
    - Creates a `DRAFT` course in PostgreSQL, verifies `getPublicCatalogAndConfig()` excludes it on the server, updates to `PUBLISHED` and verifies inclusion, updates to `ARCHIVED` and verifies exclusion, tests package price editing + 12-month recalculation, and restores initial catalog state.
11. **Suite 11 — End-to-End Admissions, Student Enrollment, Descriptive Faculty Grading, Parent Isolation & Certificate Verification**:
    - Rejects unconsented minor submissions (`parentConsentAccepted: false`).
    - Submits consented enquiry and verifies 24h duplicate submission protection.
    - Advances stage to `ENROLLMENT` and verifies Student Profile (`SV-STU-...`) + Invoice (`SV-INV-...`) creation.
    - Submits student quiz attempt (`SV-QZ-...`) and verifies `PENDING_TEACHER_REVIEW` persistence.
    - Grades descriptive response via `gradeDescriptiveQuizAttempt` and verifies `EVALUATED` status (`14/15` marks) on both the attempt and student profile.
    - Verifies Parent Portal rejects wrong PIN or wrong phone number, allows verified family access, and persists `updateParentCommunicationPreferences`.
    - Issues and verifies a public certificate (`SLG-SV-CERT-...`), then cleans up all temporary QA records.

## 3. Pre-Existing Unrelated Repository Type Errors (Documented Separately)
During full-repository `tsc --noEmit`, all Skillverse files (`src/server/services/skillverse.service.ts`, `src/server/trpc/routers/skillverse.ts`, `src/components/skillverse/*`, `src/app/(skillverse)/*`, `src/app/api/skillverse/*`, and `apps/skillverse/*`) compiled with **0 errors**.
Pre-existing type errors were observed in unrelated `src/components/admin/ims/*` and `src/components/public/ims-quote-request-form.tsx` files from an earlier IMS commit; per Rule 1, unrelated modules were not modified.
