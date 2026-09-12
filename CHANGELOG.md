# Changelog

All notable changes to SOFTLAB GLOBAL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Complete system architecture documentation foundation
- Technical specifications and technology stack evaluation
- Full relational database design with Prisma schema specifications
- Granular Role-Based Access Control (RBAC) matrix and permission mapping
- Provider-agnostic payment gateway architecture and webhook idempotency design
- Secure content delivery architecture for files and video
- End-to-end security architecture and hardening standards
- Four-day aggressive MVP development roadmap (P0/P1/P2)
- Coding standards, development rules, and contribution guidelines
- Environment variables template (`.env.example`)
- Root documentation and setup guide (`README.md`)

---

## [0.2.0] - 2026-09-11
### Day 1 Foundation Release
- **Application Core**: Initialized Next.js 14 App Router, TypeScript strict mode, Tailwind CSS with SOFTLAB GLOBAL branding palette (`#10B981` + white + slate accents).
- **Database & Persistence**: Implemented PostgreSQL + Prisma 5 relational schema (`Role`, `User`, `AuditLog`, `StudentProfile`, `TrainerProfile`, `Course`), CUID2 primary keys, integer Paise financial modeling, and Prisma client singleton.
- **RBAC & Seed System**: Seeded all 11 documented institutional roles with exact granular permissions and discount caps; added safe idempotent seed script with initial `SUPER_ADMIN` credentials provisioning via environment variables and bcryptjs (12 rounds).
- **Authentication & Sessions**: Implemented NextAuth v5 credentials authentication, secure JWT session cookies (8h max-age), server-side session validation, and universal `/login` portal.
- **Route Protection & Server RBAC**: Configured Edge-compatible middleware and server procedure guards (`requireAuth`, `requireRole`, `requirePermission`) enforcing role boundaries across `/student/*`, `/trainer/*`, `/counselor/*`, and `/admin/*`.
- **API Protocol**: Configured tRPC v11 with superjson transformer, Zod input validation, role/permission procedure middleware, and root AppRouter (`auth`, `admin`, `dashboard`).
- **Shared Dashboard Shells**: Created accessible UI primitives (`Button`, `Card`, `Input`, `Label`, `Badge`, `Table`, `Dialog`, `LoadingSpinner`, `EmptyState`, `ErrorState`, `AlertBanner`) and responsive protected dashboard shells for Student, Trainer, Counselor, and Admin portals.
- **Security & Auditability**: Configured HTTP security headers (CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff), brute-force rate limiter, Zod environment variable parsing, and append-only audit logging.

## [0.1.0] - 2026-09-11
### Initial Architecture Release
- Architecture and system design phase completed
- Ready for foundation phase implementation

## [0.11.0] - 2026-09-12
### Day 11 Placement Ecosystem, Corporate Relations & Student Career Portal
- **Database & Data Modeling**:
  - Authored and applied Prisma migration `20260912120000_day11_placement` introducing `CorporatePartner`, `JobDrive`, `StudentPlacementProfile`, `PlacementApplication`, and `InterviewRound` models with proper composite uniqueness and indexation.
- **Backend Architecture & Gating**:
  - Implemented `CorporatePartnerService`, `JobDriveService`, and `PlacementApplicationService` maintaining strict file line budgets (< 350 lines per file).
  - Engineered multi-factor eligibility verification: course enrollment checking, examination pass mark verification, and Day 10 certificate status gating.
  - Implemented automated placement synchronization: moving an applicant to `PLACED` updates the student's public placement profile with hiring company and package details.
  - Created `placementRouter` mounted in AppRouter, exposing secure procedures for corporate relations, drive creation, student applications, and interview scheduling.
- **User Interface**:
  - Developed Admin Placement Console (`/admin/placements`) with key recruitment metrics, partner management, drives list, and multi-stage candidate pipelines.
  - Developed Student Career Portal (`/student/placements`) with eligible drive discovery, real-time eligibility feedback, application timeline tracking, and candidate portfolio manager (`StudentProfileEditor`).
- **Quality & Verification**:
  - Authored automated end-to-end verification suite `scripts/verify-day11.ts` validating all 6 core functional and security stages.

## [0.10.0] - 2026-09-12

### Day 10 Hardened Assessment & Digital Certification Release
- **Examinations & Question Bank**:
  - Implemented `Exam`, `QuestionBank`, `ExamQuestion`, `ExamAttempt`, `ExamAnswer`, and `Certificate` database models with complete indexation and foreign key relationships.
  - Authored `QuestionBankService` supporting MCQ and True/False questions with points, difficulty levels, topics, explanations, and negative marking configurations.
  - Explicitly marked subjective/short-answer questions as non-evaluable automatically to prevent false completion claims.
- **Security & RBAC Enforcement**:
  - Enforced active student enrollment validation on `getStudentExamView` and all student exam procedures before question delivery.
  - Implemented zero-trust question stripping: `correctAnswer` and `explanation` are strictly withheld from client responses until server evaluation.
  - Guarded all administrative exam procedures (`createExam`, `updateExam`, `updateStatus`, `addQuestions`, `removeQuestion`, `createQuestion`, `listQuestions`, `listAdminExams`, `getAdminExamDetails`) with `adminExamProcedure` RBAC middleware rejecting unauthorized roles (Student, Counselor, Telecaller).
- **Exam Player & Attempt Engine**:
  - Engineered resilient exam player with live timer countdown, low-time visual alerts, question palette with answered/review status, real-time autosave, and mark-for-review toggles.
  - Restores saved answers and review flags from database state upon browser refresh or attempt resumption.
  - Added server-side expiration validation with auto-submit timeout triggers.
  - Ensured double-submission idempotency returning consistent evaluation metrics without duplicate writes.
- **Verifiable Digital Certification & Privacy**:
  - Implemented collision-free certificate number generator (`SLG-CERT-YYYY-XXXXX`) utilizing synchronous sequence reservation and entropy fallback under high concurrent load.
  - Integrated QR code generation linking to canonical verification portal `/verify/certificate/[certificateNumber]`.
  - Public verification sanitizes all private student contact information (email, phone, guardian data).
  - Admin revocation recording acting administrator ID, revocation timestamp, and mandatory audit reason.
  - Multi-criteria course completion evaluation requiring all exams passed, minimum 75% attendance, and full fee clearance before certificate issuance.
- **Database Migrations & Verification**:
  - Established Prisma baseline migration (`0_init`) moving repository from `db push` to structured migrations (`npx prisma migrate dev` / `deploy`).
  - Added and passed 14-point security and concurrency test suite (`scripts/verify-day10-hardening.ts`) and 16-point Day 10 test suite (`scripts/verify-day10.ts`).
  - Successfully compiled all routes under Next.js 14 production build (`npm run build`).
