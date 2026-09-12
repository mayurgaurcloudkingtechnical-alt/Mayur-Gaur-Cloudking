# SOFTLAB GLOBAL — Four-Day MVP Implementation Roadmap & Priority Classification

> **Document Version:** 1.0.0  
> **Target:** Production-Grade Education Ecosystem  
> **Classification Methodology:** P0 (Essential Core), P1 (High-Value Functional), P2 (Enhancements & Polish)

---

## 1. Feature Priority Classification Matrix

To deliver a reliable, secure, and fully functional system without compromising code quality or security, features are strictly partitioned:

### 🔴 P0: Essential Core (Non-Negotiable MVP Foundation)
*Must be 100% complete, tested, and secure before public launch.*
- **System Foundation**: Monorepo scaffolding, Next.js 14 App Router, Tailwind CSS design system with brand light green (`#10B981`) aesthetic.
- **Relational Data Layer**: PostgreSQL 16 schema deployment, Prisma migrations, and database seed scripts (roles, default admin, initial courses).
- **Authentication & RBAC**: NextAuth.js v5 credentials flow, password hashing (bcrypt), session cookies, server-side procedure authorization middleware.
- **Public Portal**: Marketing landing page with institutional information (Patrika Chauraha address, GSTIN, Phone 9194085890), course catalog, and dynamic course detail views.
- **Course CMS**: Course, Module, and Lesson CRUD, drag-and-drop reordering, draft/published lifecycle states, video/PDF/document content types.
- **Student LMS**: Student dashboard, enrolled course viewer, secure video playback with ephemeral tokens, PDF viewer, lesson progress completion tracking.
- **Trainer LMS**: Assigned course & batch dashboard, daily class attendance marking, and syllabus delivery.
- **Counselor CRM**: Lead pipeline management (New, Contacted, Follow-up, Interested, Admitted, Lost), scheduled follow-up tracking.
- **Admissions & Fee Engine**: Course selection, base fee lookup, percentage/fixed discount calculator, server-side discount authorization cap checks.
- **Payment Gateway**: Provider-agnostic payment layer with Razorpay integration, HMAC-SHA256 signature verification, webhook idempotency, and automatic instant LMS enrollment.
- **Verifiable Certificates**: Generation of unique certificate IDs (`SLG-CERT-YYYY-XXXXX`), public verification route (`/verify-certificate/:code`).

---

### 🟡 P1: High-Value Operational Modules
*Essential for full daily institutional operations; delivered seamlessly on days 3 and 4.*
- **Assessment & Exam Engine**: Question bank management, timed MCQ quizzes and tests, automatic scoring, pass/fail thresholds.
- **Digital Marksheets**: Automated semester/course marksheet generation with official branding, student details, percentage, and grade.
- **Placement Ecosystem**: Company directory, job postings, eligibility mapping, student resume profiles, application tracking, interview scheduling.
- **Staff & HR ERP**: Employee registry, department & designation mapping, staff attendance, leave application and approval workflow.
- **Business Reports & Analytics**: Daily/monthly admission volume, revenue collections, pending student fees, counselor conversion rates, exportable to CSV.
- **In-App Notification Engine**: Real-time bell notifications for new leads, fee receipts, exam announcements, and admission confirmations.

---

### 🟢 P2: Post-Launch Enhancements
*Advanced enterprise capabilities scheduled for continuous delivery post-MVP.*
- Automated Zoom/Google Meet API synchronization (currently supported via manual meeting URL inputs).
- Anti-screen capture biometric proctoring and webcam snapshot logging during exams.
- Advanced AI-powered resume parsing and candidate matching for placement officers.
- SMS / WhatsApp Business API transactional notifications.
- Bulk student enrollment via CSV import with asynchronous email dispatch.

---

## 2. Four-Day Implementation Execution Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ DAY 1: Architectural Foundation, Database, Auth & Universal RBAC             │
│ - Initialize Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui    │
│ - Deploy PostgreSQL schema via Prisma ORM + Seeds for 11 Roles & Super Admin│
│ - NextAuth.js v5 authentication + Server-Side RBAC Middleware               │
│ - Shared UI Shell: Navigation, responsive light green / white theme         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ DAY 2: Course CMS, Student LMS, Trainer Portal & Counselor CRM              │
│ - Course, Module, Lesson CMS (Reordering, Publishing Invariance)           │
│ - Student LMS: Video player with signed URL protection, progress tracking   │
│ - Trainer LMS: Assigned batch views, student roster, daily attendance mark  │
│ - Counselor CRM: Lead pipeline, follow-up calendar, conversion status       │
│ - Admissions & Discount Engine: Server-side tiered discount limits          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ DAY 3: Payments, Exams, Marksheets, Certificates, Placement & HR            │
│ - Razorpay Payment Gateway integration + Webhook HMAC verification          │
│ - Post-Payment auto-enrollment state machine & receipt generation           │
│ - Question Bank & Timed Exam Engine (Auto-grading, grades calculation)      │
│ - Digital Marksheet & Verifiable Certificate generation (/verify-certificate)│
│ - Placement Portal (Companies, Jobs, Applications, Student Profiles)        │
│ - HR Portal (Staff directory, leaves, attendance)                           │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ DAY 4: Security Hardening, Reports, Testing, Responsive Polish & Deploy     │
│ - Institutional Reports: Revenue, Admissions, Conversions (CSV export)      │
│ - Security Audit: Rate limiting, CSRF/XSS sanitization, HTTP secure headers │
│ - Unit & Integration Testing (Vitest): Fee calculations, RBAC guards        │
│ - Responsive UI audit across mobile, tablet, and desktop                    │
│ - Production Docker containerization, PM2/Nginx reverse proxy, env setup   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Daily Milestones & Deliverables Breakdown

### Day 1: Foundation & Identity
- [x] Full architecture documentation foundation created.
- [ ] Initialize Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui.
- [ ] Define and apply full Prisma PostgreSQL schema.
- [ ] Execute database seed: All 11 roles with default permissions, initial super-admin, sample departments.
- [ ] Implement NextAuth.js v5 credentials provider with bcrypt password verification.
- [ ] Build reusable layout shells for Public, Student, Trainer, Counselor, and Admin portals.
- [ ] Implement tRPC router framework with `protectedProcedure` and `requirePermission` guards.

### Day 2: Academic Core, CRM & Admissions
- [ ] Course Management CMS: Create, edit, reorder, and publish courses, modules, and lessons.
- [ ] Support lesson types: `VIDEO`, `PDF`, `DOCUMENT`, `RICH_TEXT`, `ASSIGNMENT`.
- [ ] Student LMS: Dashboard, course curriculum accordion, video player with signed playback token, lesson progress checklist.
- [ ] Trainer LMS: Assigned courses/batches, batch student roster, daily attendance marker.
- [ ] Counselor CRM: Lead table/Kanban board, follow-up scheduler, status updater.
- [ ] Admission Engine: Course selection, fee breakdown, discount input (percentage & fixed), role cap check, and approval routing.

### Day 3: Payments, Assessments, Verification & Operations
- [ ] Payment Gateway Integration: Abstract `PaymentGateway` with Razorpay adapter.
- [ ] Webhook endpoint: Raw body HMAC-SHA256 signature verification and idempotency check.
- [ ] Automatic LMS enrollment and digital fee receipt generation upon payment confirmation.
- [ ] Question Bank & Exam System: Multiple choice questions, time limits, auto-scoring, pass/fail results.
- [ ] Digital Marksheets: Branded marksheet generator with student ID, marks, percentage, and grade.
- [ ] Verifiable Certificate System: Certificate generation with unique code and public `/verify-certificate/:code` verification portal.
- [ ] Placement Module: Recruiter directory, job postings, student resume profiles, interview tracking.
- [ ] HR Module: Employee directory, designations, and leave approval workflows.

### Day 4: Production Hardening, Reports & Deployment
- [ ] Executive & Operations Reports: Filterable tables and charts for admissions, revenue, and attendance with CSV exports.
- [ ] Security Hardening: Apply Content Security Policy, rate limiting, and input sanitization.
- [ ] Automated Test Suite: Vitest tests for discount authorization rules, payment signature checks, and admission states.
- [ ] Mobile Responsiveness: Cross-device testing for student video player, counselor lead boards, and admin data tables.
- [ ] Production Deployment Setup: Multi-stage Dockerfile, docker-compose configuration, and production environment runbook.
