# SOFTLAB GLOBAL — System Architecture & Engineering Blueprint

> **Brand:** SOFTLAB GLOBAL  
> **Corporate Identity:** Patrika Chauraha, 13/11/8G, Tashkent Marg, Opposite Rai and Company, Civil Lines, Prayagraj, UP 211001  
> **GSTIN:** 09AFYFS5388G1ZX | **Domain:** [www.softlabglobal.com](http://www.softlabglobal.com/)

---

## 1. Architectural Philosophy & Principles

SOFTLAB GLOBAL is an enterprise-grade education management platform engineered around the following core architectural axioms:

1. **Monolithic Modularity (Modular Monolith)**: A unified, type-safe codebase organized strictly into isolated, domain-driven modules (`courses`, `admissions`, `lms`, `crm`, `exams`, `finance`, `placement`, `hr`). The platform can be deployed as a single resilient service while maintaining clear boundaries that allow extraction into microservices if scaling demands dictate.
2. **End-to-End Type Safety**: Shared TypeScript typings spanning database schema (Prisma), API validation (Zod + tRPC), and frontend UI state (React Server Components + TanStack Query).
3. **Server-Enforced Authorization**: Frontend permission checks serve solely for UX optimization (conditional UI rendering). Every data mutation and retrieval procedure is protected server-side via cryptographic session verification and granular RBAC middleware.
4. **Resilient Financial Transactions**: Zero trust on client-submitted prices or payment statuses. All pricing, discount boundaries, and payment confirmation workflows execute through verified server-to-server channels with cryptographic verification and idempotency keys.
5. **Zero-Trust Media Delivery**: No sensitive courseware (videos, test papers, student assignment submissions) is ever stored in public object storage buckets. Everything requires signed, short-lived URLs minted by authenticated API gateways.

---

## 2. High-Level System Architecture Diagram

```
                                 [ INTERNET / CLIENTS ]
                                            │
                      ┌─────────────────────┴─────────────────────┐
                      │ Cloudflare Edge (WAF, DDoS, SSL, CDN)     │
                      └─────────────────────┬─────────────────────┘
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │      Next.js 14 Web Application Cluster       │
                    │  (App Router / Node.js Runtime / Edge Middle) │
                    └───────────────────────┬───────────────────────┘
                                            │
          ┌─────────────────────────────────┼─────────────────────────────────┐
          │                                 │                                 │
          ▼                                 ▼                                 ▼
┌──────────────────┐              ┌──────────────────┐              ┌──────────────────┐
│  Public Portal   │              │ Student/Trainer  │              │  Admin / Staff   │
│ Marketing, SEO   │              │  Dedicated LMS   │              │ ERP & CRM Suites │
└─────────┬────────┘              └─────────┬────────┘              └─────────┬────────┘
          │                                 │                                 │
          └─────────────────────────────────┼─────────────────────────────────┘
                                            │
                                            ▼
           ┌─────────────────────────────────────────────────────────────────┐
           │                     API & Authorization Layer                   │
           │  - NextAuth.js v5 (Secure Session & Cookie Encryption)          │
           │  - tRPC Procedure Middleware (Granular RBAC Guard)              │
           │  - Zod Request Sanitization & Rate Limiter                      │
           └────────────────────────────────┬────────────────────────────────┘
                                            │
                                            ▼
           ┌─────────────────────────────────────────────────────────────────┐
           │                   Domain Services (Pure Logic)                  │
           │  CourseService | AdmissionEngine | DiscountValidator           │
           │  PaymentAdapter | ExamEngine | CertificateSigner | HRService    │
           └───────────────┬───────────────────────────────┬─────────────────┘
                           │                               │
         ┌─────────────────┴─────────┐         ┌───────────┴─────────────────┐
         ▼                           ▼         ▼                             ▼
┌──────────────────┐   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL 16   │   │  Redis 7 Cache   │  │ S3 / Cloudflare  │  │  Bunny.net Stream│
│ Primary DB via   │   │  BullMQ Queue &  │  │ R2 Encrypted     │  │  Signed DRM HLS  │
│ Prisma ORM (ACID)│   │  Session Store   │  │ Private Storage  │  │  Video Delivery  │
└──────────────────┘   └──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 3. Modular Application Architecture

The system is structured into domain packages and modules to guarantee modularity and maintainability:

```
src/
├── app/                              # Next.js App Router (Routing & Layouts)
│   ├── (public)/                     # Public Website, Catalog, Certificate Verification
│   │   ├── page.tsx                  # Landing Page
│   │   ├── courses/                  # Public Course Directory & Details
│   │   ├── verify-certificate/[code] # Public Certificate Verification Engine
│   │   └── contact/                  # Contact & Inquiry Form
│   ├── (auth)/                       # Authentication Flow
│   │   ├── login/                    # Universal Single Login
│   │   ├── forgot-password/          # Password Recovery
│   │   └── reset-password/           # Password Reset Action
│   ├── (student)/                    # Student Learning Management System (LMS)
│   │   ├── dashboard/                # Progress overview, upcoming classes, alerts
│   │   ├── courses/                  # My Enrolled Courses & Lesson Viewer
│   │   ├── marketplace/              # Browse & Buy Additional Courses
│   │   ├── assignments/              # Pending submissions & grades
│   │   ├── exams/                    # Timed MCQ/Subjective Quizzes & Tests
│   │   ├── marksheets/               # Digital Marksheet generation & downloads
│   │   ├── certificates/             # Download verifiable certificates
│   │   ├── fees/                     # Payment history, outstanding dues, receipts
│   │   └── placement/                # Resume, skills, job applications, interviews
│   ├── (trainer)/                    # Trainer LMS Workspace
│   │   ├── dashboard/                # Assigned batches & student rosters
│   │   ├── classes/                  # Class schedule & Zoom/Meet integrations
│   │   ├── attendance/               # Daily batch attendance logging
│   │   ├── content/                  # Course/Module/Lesson CMS editor
│   │   └── grading/                  # Assignment & subjective exam evaluations
│   ├── (counselor)/                  # Counselor CRM & Sales Engine
│   │   ├── leads/                    # Lead database & status pipelines
│   │   ├── follow-ups/               # Today's call agenda & history
│   │   ├── admissions/               # New enrollment & fee discount calculator
│   │   └── analytics/                # Individual conversion ratios & metrics
│   ├── (admin)/                      # Unified Admin & Executive ERP
│   │   ├── admissions/               # Admission approvals & registrations
│   │   ├── courses/                  # Course catalog management & publishing
│   │   ├── batches/                  # Batch creation, trainer allocation, schedules
│   │   ├── finance/                  # Revenue, discounts, pending fees, offline audit
│   │   ├── exams/                    # Centralized Question Bank & Exam builder
│   │   ├── certificates/             # Batch issuing & revocation engine
│   │   ├── placement/                # Corporate recruiters, job postings, tracking
│   │   ├── hr/                       # Employee directory, leaves, attendance
│   │   ├── reports/                  # Multi-variable operational & business reports
│   │   └── settings/                 # Global configurations, RBAC permissions
│   └── api/                          # Webhooks & External Route Handlers
│       ├── trpc/[trpc]/              # Universal tRPC endpoint router
│       ├── webhooks/razorpay/        # Idempotent HMAC Payment Webhook
│       └── content/signed-url/       # Temporary credential minter
├── components/                       # UI Library & Atoms
│   ├── ui/                           # Base shadcn/ui components (Radix primitives)
│   ├── public/                       # Landing, Course cards, Navbar, Footer
│   ├── student/                      # Video player, Quiz widget, Marksheet card
│   ├── trainer/                      # Attendance table, Syllabus drag-drop reorder
│   ├── counselor/                    # Lead board (Kanban), Discount modal
│   └── admin/                        # Analytics charts, DataTables, RBAC toggles
├── server/                           # Server-Side Domain Architecture
│   ├── trpc/                         # tRPC Routers, Context, Middleware
│   ├── services/                     # Business Logic Services (DB interactions)
│   │   ├── admission.service.ts      # Fee computation & discount approval logic
│   │   ├── payment.service.ts        # Order creation, verification, ledgering
│   │   ├── course.service.ts         # Course/Module/Lesson lifecycle & publishing
│   │   ├── exam.service.ts           # Question evaluation, grading, grade calculations
│   │   ├── certificate.service.ts    # Unique code generation, verification, PDF
│   │   ├── placement.service.ts      # Job openings & application state machine
│   │   └── hr.service.ts             # Staff, leaves, payroll reference records
│   ├── lib/                          # Third-Party Infrastructure Adapters
│   │   ├── payment/                  # Razorpay & Abstract Gateway Provider
│   │   ├── storage/                  # S3 & Cloudflare R2 presigned URL manager
│   │   ├── video/                    # Bunny.net token generator
│   │   ├── email/                    # Resend / Nodemailer transactional dispatcher
│   │   └── pdf/                      # Puppeteer/React-PDF generator
│   └── db/                           # Prisma Client Singleton & Utilities
└── types/                            # Global TypeScript definitions
```

---

## 4. Cross-Cutting Concerns

### 4.1 Multi-Portal Separation & Routing Guard
Even though SOFTLAB GLOBAL runs as a single deployable artifact, strict route isolation is enforced via `middleware.ts`. 

```typescript
// Conceptual routing boundary in Next.js middleware
export function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // 1. Unauthenticated users cannot enter any portal
  if (!token && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Role-specific boundary routing
  if (pathname.startsWith('/admin') && !hasAnyRole(token, ['SUPER_ADMIN', 'DIRECTOR', 'ADMIN', 'MANAGER'])) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/trainer') && token.role !== 'TRAINER') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/counselor') && !hasAnyRole(token, ['COUNSELOR', 'TELECALLER'])) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  if (pathname.startsWith('/student') && token.role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
}
```

### 4.2 Error Handling & Telemetry
1. **API Protocol Errors**: Handled using structured `TRPCError` codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`).
2. **Business Domain Exceptions**: Custom typed classes (e.g., `DiscountExceededException`, `DuplicateEnrollmentException`, `PaymentMismatchException`).
3. **Audit Logging**: Sensitive mutations (role promotion, manual discount override, offline payment approval) execute within Prisma transactions alongside an entry into the immutable `AuditLog` table.

---

## 5. Deployment Topology

The production architecture is designed for containerized deployment (Docker) on scalable infrastructure (e.g., AWS ECS, DigitalOcean App Platform, or Hetzner VPS with Coolify):

```
                       [ Traffic / HTTPS ]
                                │
                        [ NGINX Reverse Proxy ]
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│ Next.js Web App Container #1  │       │ Next.js Web App Container #2  │
│ Port 3000 (Stateless Instance)│       │ Port 3000 (Stateless Instance)│
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Managed PostgreSQL 16 │ │ Redis 7.x Cluster     │ │ BullMQ Background     │
│ (Primary + Read Repl) │ │ (Session & Job Queues)│ │ Worker Container      │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

This ensures complete horizontal scalability: web application instances can scale from 1 to 20+ containers with zero shared local disk dependency.
