# SOFTLAB GLOBAL — IT Education Management Platform

> **Brand:** SOFTLAB GLOBAL  
> **Domain:** [www.softlabglobal.com](http://www.softlabglobal.com/)  
> **Address:** Patrika Chauraha, 13/11/8G, Tashkent Marg, Opposite Rai and Company, Civil Lines, Prayagraj, Uttar Pradesh 211001  
> **Phone:** +91 9194085890  
> **GSTIN:** 09AFYFS5388G1ZX  
> **Design Theme:** Premium modern SaaS, Light Green (`#10B981` / `#059669`) + Pure White + Slate Dark Accents.

---

## 🚀 Executive Summary & Architecture Foundation

**SOFTLAB GLOBAL** is a production-grade, enterprise-ready IT Education Management Platform engineered to govern the entire academic and operational lifecycle of a modern technology institute. 

This repository contains clean, modular, and maintainable TypeScript source code covering:
- **Public Website & Course Marketplace**: Brand discovery, public course catalog, student testimonials, certificate verification portal.
- **Student LMS**: Role-tailored learning workspace featuring progressive curriculum tracking (Course → Module → Lesson), secure video/PDF consumption, interactive quizzes/exams, assignment submissions, digital marksheets, fee receipts, and full placement portfolio builder.
- **Trainer LMS**: Pedagogical workspace for assigned courses/batches, syllabus delivery, live class scheduling, daily attendance marking, assessment evaluation, and progress grading (with zero access to financial or discount data).
- **Counselor CRM**: End-to-end sales and conversion engine handling leads, multi-channel pipelines, scheduled follow-ups, and student admissions.
- **Admission & Discount Rule Engine**: Multi-tiered server-side fee calculation, percentage/fixed discount validation with strict RBAC discount thresholds (Counselor vs. Manager vs. Director), and automated financial audit logging.
- **Staff & HR ERP**: Employee onboarding, department & designation mapping, attendance, leave approval workflows, and role-governed document vaults.
- **Placement Ecosystem**: Corporate relations desk, company database, job openings, eligibility filters, student applications, multi-round interview tracking, and offer release records.
- **Finance & Provider-Agnostic Payment Engine**: Resilient payment state machine engineered for Indian payment gateways (Razorpay-ready) with HMAC signature checks, idempotent webhook ingestion, and instant automatic LMS enrollment.
- **Public Certificate & Digital Marksheet Verification**: Tamper-proof certificate issuing with cryptographic unique identifiers and publicly verifiable endpoints.

---

## 🏗️ Technical Stack Summary

| Layer | Technology | Key Architectural Responsibility |
|---|---|---|
| **Framework** | **Next.js 14 (App Router)** | Full-stack hybrid React Server Components (RSC) and Server Actions |
| **Language** | **TypeScript 5.x** | Strict mode compile-time safety across database, API, and UI |
| **Styling & Design** | **Tailwind CSS v3 + shadcn/ui** | Light green modern IT SaaS aesthetic, Radix UI accessibility |
| **API Protocol** | **tRPC v11 + Next.js Route Handlers** | End-to-end type safety, Zod schema validation, procedure middleware |
| **Database** | **PostgreSQL 16** | Relational integrity, ACID financial transactions, JSONB, foreign keys |
| **ORM** | **Prisma 5.x** | Declarative schema, automated migrations, type-safe query generation |
| **Authentication** | **NextAuth.js v5 (Auth.js)** | HttpOnly secure session cookies, JWT rotation, bcrypt password hashing |
| **Authorization** | **Granular Server-Side RBAC** | 11 distinct roles, permission guard middleware, database caching |
| **Object Storage** | **S3-Compatible (AWS S3 / Cloudflare R2)** | Presigned short-lived upload/download URLs, zero public file buckets |
| **Video Delivery** | **Bunny.net Stream / Cloudflare Stream** | Adaptive bitrate HLS streaming, token-signed ephemeral playback URLs |
| **Payment Gateway** | **Abstract Provider Adapter (Razorpay)** | Provider-agnostic factory, raw body webhook HMAC verification |
| **Asynchronous Jobs** | **BullMQ + Redis 7** | Transactional emails, PDF generation, analytics aggregations |
| **Testing** | **Vitest + Playwright** | Unit tests for core financial logic, end-to-end portal verification |

---

## 📂 Documentation Library

Detailed architectural blueprints, database schemas, and implementation guides are located under `/docs`:

1. [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System topology, domain layers, and request lifecycles.
2. [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) — Evaluation matrices and rationale for every library and service.
3. [`docs/DATABASE_DESIGN.md`](./docs/DATABASE_DESIGN.md) — Complete relational schema, indexes, enums, and foreign keys.
4. [`docs/ROLES_PERMISSIONS.md`](./docs/ROLES_PERMISSIONS.md) — Granular matrix across 11 roles and server guards.
5. [`docs/PAYMENT_ARCHITECTURE.md`](./docs/PAYMENT_ARCHITECTURE.md) — Webhook security, state transitions, idempotency.
6. [`docs/CONTENT_ARCHITECTURE.md`](./docs/CONTENT_ARCHITECTURE.md) — Course/Module/Lesson CMS and signed media delivery.
7. [`docs/SECURITY.md`](./docs/SECURITY.md) — Defense-in-depth, OWASP controls, audit logging, and headers.
8. [`docs/FOUR_DAY_ROADMAP.md`](./docs/FOUR_DAY_ROADMAP.md) — P0 / P1 / P2 milestone classification and 4-day strategy.
9. [`docs/DEVELOPMENT_RULES.md`](./docs/DEVELOPMENT_RULES.md) — Production engineering standards, linting, and PR rules.

---

## 🧑‍💻 User Roles Matrix

The system implements 11 strictly partitioned roles enforced server-side:

| Role Code | Role Name | Primary Responsibilities |
|---|---|---|
| `SUPER_ADMIN` | Super Administrator | Root system owner, global configurations, security, role management |
| `DIRECTOR` | Executive Director | High-level business dashboards, executive discount overrides, audits |
| `ADMIN` | Academic & Operations Admin | Course catalog, batch scheduling, admissions, certificates |
| `MANAGER` | Operations / Sales Manager | Team management, mid-tier discount approval, lead reassignments |
| `COUNSELOR` | Senior Academic Counselor | Lead qualification, student admissions, limited discount application |
| `TELECALLER` | Telecaller / Outbound Rep | Cold lead outreach, follow-up scheduling, status updates |
| `TRAINER` | Faculty / Instructor | Course content CMS, live classes, student attendance, assessments |
| `HR` | Human Resources Manager | Staff directories, employee records, leave approvals, payroll inputs |
| `ACCOUNTANT` | Finance & Accounts Officer | Fee collection, offline payment validation, reconciliation, receipts |
| `PLACEMENT_OFFICER` | Placement & Corporate Officer | Employer onboarding, job drives, interview scheduling, selections |
| `STUDENT` | Enrolled Student | Consuming curriculum, submitting work, exams, fee tracking, resume |

---

## 🛠️ Quickstart (Development Setup)

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 16
- Redis 7+
- pnpm (recommended) or npm

### Installation & Bootstrapping

```bash
# 1. Clone repository
git clone https://github.com/softlabglobal/softlab-global.git
cd softlab-global

# 2. Install workspace dependencies
npm install

# 3. Environment configuration
cp .env.example .env
# Configure DATABASE_URL, NEXTAUTH_SECRET, and initial credentials:
# INITIAL_SUPER_ADMIN_EMAIL="admin@softlabglobal.com"
# INITIAL_SUPER_ADMIN_PASSWORD="ChangeMeInProduction123!"
# INITIAL_SUPER_ADMIN_NAME="Super Administrator"

# 4. Generate Prisma Client & Sync Database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Typecheck & Build Validation
npm run typecheck
npm run lint
npm run build

# 6. Launch Development Server
npm run dev
```

### Initial Access & Portal Endpoints
Once the seed script executes, authenticate at `http://localhost:3000/login`:

- **Universal Login**: `/login`
- **Admin & Executive ERP**: `/admin/dashboard`
- **Faculty / Instructor LMS**: `/trainer/dashboard`
- **Counselor & CRM Suite**: `/counselor/dashboard`
- **Student Portal**: `/student/dashboard`

---

## 🔐 Core Engineering Principles

1. **Zero Frontend-Only Security**: UI state hiding is strictly an ergonomic feature. All permissions, discount caps, and enrollment statuses are independently validated in server procedures.
2. **Deterministic Financial Precision**: All currency values are stored as integers representing **Paise** (`₹500.00` = `50000`). Floating-point arithmetic is strictly prohibited in database and business models.
3. **Signed Ephemeral URLs**: Raw video URLs and private student assignments are never directly exposed. Temporary signed tokens are minted per authenticated request.
4. **Audit Immutability**: Critical actions (role alterations, discount overrides, manual fee captures) generate append-only database audit records with request context.

---

## 📜 Intellectual Property & Maintenance

Developed exclusively for **SOFTLAB GLOBAL**. All architectural blueprints and source code are structured for zero-lockin self-hosting, on-premise migration, or cloud containerized deployment.

---

## 🎓 Day 10 Assessment, Quizzes & Digital Certification Engine

### Capabilities Implemented & Hardened:
- **Examination & Question Bank Engine**: Course quizzes, final exams, MCQ and True/False questions with points, explanations, and negative marking penalties.
- **Strict Server-Side Grading**: Zero-trust client delivery stripping answers and explanations. Timed execution with server-enforced expiration and clean timeout auto-submission.
- **Multi-Criteria Course Completion**: Evaluates required exam passes, minimum attendance percentage (e.g. 75%), and full fee clearance before awarding credentials.
- **Verifiable Digital Certificates**: Cryptographic verification tokens, collision-proof sequence numbering (`SLG-CERT-YYYY-XXXXX`), QR code generation, public verification (`/verify/certificate/[certificateNumber]`), and revocation audit controls.

### Database Migration & Management Commands:
```bash
# Local development migration
npx prisma migrate dev --name <migration_name>

# Production migration
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Database backup (PostgreSQL)
pg_dump -U postgres -h localhost -d softlab_global -F c -b -v -f backup_softlab_global_$(date +%Y%m%d).dump

# Database restore
pg_restore -U postgres -h localhost -d softlab_global -v backup_softlab_global_*.dump
```

### Verification Commands:
```bash
# Run 16-point Day 10 assessment suite
npx tsx scripts/verify-day10.ts

# Run 14-point security and concurrency hardening suite
npx tsx scripts/verify-day10-hardening.ts

# Run 6-point Day 11 Placement & Career Ecosystem suite
npx tsx scripts/verify-day11.ts

# Run full project checks
npm run typecheck
npm run lint
npm run build
```

---

## 💼 Day 11 Placement Ecosystem, Corporate Relations & Student Career Portal

### Capabilities Implemented:
- **Corporate Partner Management**: Comprehensive directory of hiring partners, industries, point-of-contacts, active drives count, and status toggling (`CorporatePartnerService`).
- **Job Drives & Multi-Factor Eligibility Engine**:
  - Gated candidate applications on target course enrollment, minimum assessment passing percentages, and Day 10 institutional certification requirements (`JobDriveService.evaluateStudentEligibility`).
  - Strict duplicate application prevention enforced at DB schema level (`@@unique([jobDriveId, studentId])`) and service layer.
- **Student Career & Placement Profile**:
  - Candidate portfolios featuring professional headline, bio, resume URL, portfolio/GitHub/LinkedIn links, and technical skill tags (`StudentProfileEditor`).
  - Automatic student placement status synchronization upon hiring (`isPlaced`, `placedCompany`, `placedPackage`).
- **Recruitment Pipeline & Interview Scheduling**:
  - Structured application stages: `APPLIED` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `OFFERED` → `PLACED` / `REJECTED`.
  - Multi-round interview coordination supporting Aptitude, Technical, Coding, HR, and Group Discussion rounds with meeting links, schedule timestamps, and evaluation feedback logs (`PlacementApplicationService`).
- **Strict RBAC & Audit Trails**:
  - All partner, drive, and pipeline mutations restricted to authorized roles (`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, `PLACEMENT_OFFICER`) and logged with `AuditService`.
  - Full multi-tenant isolation ensuring students can only access and edit their own placement profiles and submissions.

