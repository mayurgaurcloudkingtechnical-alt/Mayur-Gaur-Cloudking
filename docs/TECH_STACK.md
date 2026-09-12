# SOFTLAB GLOBAL — Technology Stack & Architectural Decision Records (ADR)

> **Document Version:** 1.0.0  
> **Status:** Approved for Implementation  
> **Target Audience:** Engineering Team, System Architects, Future Maintainers

---

## 1. Selection Criteria & Evaluation Matrix

Each architectural component was rigorously evaluated against seven criteria:
1. **Maintainability**: Clear architectural separation, clean idioms, zero spaghetti code.
2. **Developer Availability**: Technologies with massive, active talent pools across India and globally.
3. **Type Safety**: End-to-end type soundness from database schemas down to UI forms.
4. **Security Hardening**: Native defenses against OWASP Top 10 vulnerabilities.
5. **Operational Cost**: High performance without incurring prohibitive per-seat licensing fees.
6. **Performance & Scalability**: Sub-second server response times and efficient asset streaming.
7. **Future Portability**: Zero proprietary vendor lock-in; capability to self-host anywhere via Docker.

---

## 2. Layer-by-Layer Technical Decisions

### 2.1 Full-Stack Application Framework
- **Selected:** **Next.js 14 (App Router) with TypeScript**
- **Decision Rationale:**
  - Unifies client components and React Server Components (RSC) into a single cohesive runtime.
  - Native Edge and Node.js runtime support enables fast global page loads for public marketing pages while providing full Node.js API power for complex PDF generation and webhook processing.
  - Eliminates CORS issues between API and UI while preserving strict internal service boundaries.
- **Alternatives Rejected:**
  - *Remix (React Router v7)*: High quality, but smaller third-party ecosystem and smaller developer talent pool in regional markets.
  - *Separate Express.js + React SPA*: Double configuration burden, duplicated TypeScript interfaces, prone to API contract drift.

---

### 2.2 API Communication & Validation Layer
- **Selected:** **tRPC v11 + Zod v3**
- **Decision Rationale:**
  - End-to-end compile-time contract without code-generation steps. Renaming a backend procedure or modifying an input argument immediately flags compile errors in frontend consumer components.
  - Built-in procedure middleware allows declarative server-side RBAC enforcement (`protectedProcedure.use(requirePermission('courses:publish'))`).
  - Zod schemas are defined once and reused for both client-side form validation (via React Hook Form) and server-side input sanitization.
- **Alternatives Rejected:**
  - *REST (Raw Express/Fetch)*: Lacks automatic compile-time client synchronization; prone to breaking changes and runtime `undefined` bugs.
  - *GraphQL (Apollo/Nexus)*: Over-engineered for a unified application; introduces substantial schema definition overhead and complex caching layer management.

---

### 2.3 Relational Database & ORM
- **Selected:** **PostgreSQL 16 + Prisma ORM**
- **Decision Rationale:**
  - PostgreSQL delivers rock-solid ACID compliance, essential for institutional fee ledgers, admissions, and payment transaction integrity.
  - Native support for JSONB (for dynamic question bank configurations and audit snapshots) and Full-Text Search.
  - Prisma provides declarative schema modeling, automatic migration file generation, and fully typed query generation that prevents querying non-existent columns.
- **Alternatives Rejected:**
  - *MongoDB / Document DB*: Lack of strict relational foreign keys and relational constraints creates data consistency risks for institutional admissions, fees, and marksheet ledgers.
  - *TypeORM / Sequelize*: Weak type safety compared to Prisma, historical stability issues with migration tools.

---

### 2.4 User Authentication & Session Security
- **Selected:** **NextAuth.js v5 (Auth.js) with JWT Session Strategy**
- **Decision Rationale:**
  - Completely self-hosted; zero monthly per-user billing overhead.
  - Encrypted, HttpOnly, SameSite=Strict cookies protect against XSS token harvesting.
  - Password hashing via `bcryptjs` with cost factor 12.
  - Seamless expansion path to Google Workspace / Microsoft Single Sign-On (SSO) for corporate students or staff.
- **Alternatives Rejected:**
  - *Clerk / Auth0 / Supabase Auth*: Expensive per-user recurring costs that penalize high-volume educational student enrollments.

---

### 2.5 Styling System & UI Primitives
- **Selected:** **Tailwind CSS v3 + Radix UI Primitives (via shadcn/ui)**
- **Decision Rationale:**
  - Aligns with brand identity: Modern IT institute aesthetic using light green (`emerald-500` / `#10B981`), crisp slate backgrounds, and pristine white cards.
  - `shadcn/ui` provides copy-into-codebase UI primitives with full ownership. Zero dependency lock-in.
  - Radix UI primitives guarantee WCAG 2.1 AA accessibility (keyboard navigation, ARIA attributes).
- **Alternatives Rejected:**
  - *Material UI (MUI)*: Heavy runtime CSS-in-JS overhead; hard to override opinionated Google aesthetics to achieve the desired modern SaaS look.
  - *Chakra UI*: Runtime styling overhead; slower rendering on data-intensive tables.

---

### 2.6 File & Object Storage Architecture
- **Selected:** **AWS S3 / Cloudflare R2 (S3-Compatible Object Store)**
- **Decision Rationale:**
  - Presigned upload and download URLs. Student assignment submissions and course PDFs stream directly between client and cloud storage; application servers never bottleneck on heavy file streams.
  - Cloudflare R2 provides $0 egress fees, drastically lowering media delivery costs for study materials and student project portfolios.
  - Fully decoupled via an abstract `StorageService` interface; switching between S3, MinIO, and R2 requires changing only `.env` settings.
- **Alternatives Rejected:**
  - *Local File System Storage*: Incompatible with multi-container horizontal cloud scaling and ephemeral container instances.

---

### 2.7 Video Content & DRM Streaming
- **Selected:** **Bunny.net Stream (with Cloudflare Stream compatibility)**
- **Decision Rationale:**
  - Automatic multi-bitrate HLS transcoding (360p, 480p, 720p, 1080p).
  - Secure token authentication: Video playback URLs require SHA-256 HMAC tokens tied to student IP addresses and 10-minute expiration windows.
  - High CDN density across Indian tier-1 and tier-2 cities ensuring buffer-free streaming on mobile networks.
- **Alternatives Rejected:**
  - *Unlisted YouTube / Vimeo*: Easily ripped via browser extensions; unlisted links can be shared freely with non-enrolled students.
  - *Self-hosted HLS via FFmpeg*: Enormous server CPU overhead and complex video infrastructure management.

---

### 2.8 Payment Processing Layer
- **Selected:** **Razorpay with Provider-Agnostic Adapter Pattern**
- **Decision Rationale:**
  - Industry leader in India: seamless support for UPI, Google Pay, PhonePe, NetBanking, Debit/Credit Cards, and educational EMIs.
  - Built-in webhook events with HMAC-SHA256 signature headers.
  - Abstract `PaymentGateway` interface guarantees the application can incorporate Cashfree, PayU, or Stripe without rewriting admission or billing modules.
- **Alternatives Rejected:**
  - *Direct Razorpay SDK coupling in business controllers*: Creates vendor lock-in that makes switching gateways or testing offline payment flows difficult.

---

### 2.9 Background Workers & Task Queues
- **Selected:** **BullMQ + Redis 7**
- **Decision Rationale:**
  - Dedicated asynchronous job queue for CPU-intensive tasks: PDF marksheet rendering, cryptographic certificate generation, student email notifications, and daily attendance aggregations.
  - Automatic retries with exponential backoff and dead-letter queue (DLQ) inspection.
- **Alternatives Rejected:**
  - *Synchronous API processing*: Generating a multi-page PDF or sending bulk batch emails in the main HTTP request cycle leads to gateway timeouts.

---

## 3. Technology Stack Specification Matrix

| Domain | Technology Chosen | Version | Purpose & Value |
|---|---|---|---|
| **Runtime** | Node.js | 20.x LTS | Server execution environment |
| **Language** | TypeScript | 5.4+ | Strict compile-time static type analysis |
| **Frontend Framework** | Next.js (App Router) | 14.2+ | Hybrid RSC, SSR, and client execution |
| **CSS Engine** | Tailwind CSS | 3.4+ | Utility-first styling with brand light green palette |
| **Component Kit** | shadcn/ui + Radix UI | Latest | Accessible, self-owned UI component primitives |
| **State Management** | TanStack Query v5 + Zustand | Latest | Server cache sync + lightweight client state |
| **Form Management** | React Hook Form + Zod | Latest | High-performance, schema-driven input validation |
| **Data Table** | TanStack Table v8 | Latest | Virtualized, sortable, filterable ERP grids |
| **Charts & Metrics** | Recharts | 2.12+ | Interactive revenue and student performance analytics |
| **API Framework** | tRPC | 11.x | End-to-end typed RPC protocol |
| **Database** | PostgreSQL | 16 | ACID-compliant relational persistence |
| **ORM** | Prisma | 5.14+ | Typed schema modeling and database migrations |
| **Authentication** | NextAuth.js | 5.0 (Beta) | Session management and credentials provider |
| **Security Cryptography** | bcryptjs + crypto | Latest | Password hashing & HMAC signature checks |
| **Object Storage** | @aws-sdk/client-s3 | v3 | S3/R2 presigned upload/download manager |
| **PDF Generation** | @react-pdf/renderer | 3.4+ | High-resolution digital certificates & marksheets |
| **Job Queue** | BullMQ | 5.8+ | Redis-backed asynchronous worker tasks |
| **Unit Testing** | Vitest | 1.6+ | Blazing fast ESM test runner |
| **E2E Testing** | Playwright | 1.44+ | Full cross-browser student journey validation |
| **Containerization** | Docker + Compose | 26+ | Standardized, portable multi-container environment |
