# SOFTLAB GLOBAL — Engineering Standards & Development Rules

> **Document Version:** 1.0.0  
> **Target Audience:** All Software Engineers, Technical Leads, and AI Collaborators  
> **Mandate:** Production Quality Invariance (No prototypes, no fake code, strict maintainability)

---

## 1. Zero-Tolerance Engineering Rules

Every pull request and commit must comply with the following mandatory engineering rules:

1. **No Fake / Stubbed Behavior in Production Paths**: Mock data, simulated timeouts, hardcoded successful payment responses, or bypasses of database transactions are strictly forbidden in production code. All features must interact with real PostgreSQL models and real APIs.
2. **Server-Side Authorization Invariance**: Hiding buttons, links, or routes on the frontend is purely a convenience for user experience. Every single tRPC procedure and API Route Handler must independently enforce authentication and role permissions.
3. **Integer Currency Values (Paise)**: Floating-point numbers are prohibited for financial calculations. All currency values in schemas, APIs, and business calculations must be integers representing **Paise** (₹1 = 100 Paise).
4. **Strict TypeScript Mode**: The project compiler runs with `"strict": true`, `"noImplicitAny": true`, and `"strictNullChecks": true`. The use of `any` is banned; use `unknown` with type guards or proper generic types.
5. **No Monolithic Source Files**: No single code file may exceed 350 lines of code. Large components or routers must be decomposed into sub-components, helper utilities, and specialized domain services.
6. **No Hardcoded Credentials**: API secrets, database connection strings, and webhook tokens must be loaded exclusively through the validated `env` configuration.

---

## 2. Code Organization & Directory Structure

Code is organized strictly by domain, separating presentation, routing, business logic, and database access:

```
src/
├── app/                  # Next.js App Router (UI routes, page layouts, route handlers)
├── components/           # React UI Components
│   ├── ui/               # Primitive base components (shadcn/ui, Radix primitives)
│   ├── common/           # Shared application components (Navbar, Footer, Sidebar, PageHeader)
│   ├── student/          # Student LMS-specific widgets (VideoPlayer, QuizRunner, MarksheetCard)
│   ├── trainer/          # Trainer LMS-specific widgets (AttendanceGrid, SyllabusEditor)
│   ├── counselor/        # CRM widgets (LeadKanban, FollowUpModal, DiscountCalculator)
│   └── admin/            # ERP widgets (DataTable, UserRoleDialog, RevenueChart)
├── server/               # Pure Server-Side Code (Node.js runtime only)
│   ├── trpc/             # tRPC Router definitions, context, and RBAC middleware
│   │   ├── routers/      # Domain routers (courses, admissions, payments, exams, etc.)
│   │   ├── middleware/   # Authentication, permission guards, rate limiting
│   │   └── context.ts    # Request context providing session and db client
│   ├── services/         # Domain Business Services (Pure logic, Prisma transactions)
│   │   ├── course.service.ts
│   │   ├── admission.service.ts
│   │   ├── payment.service.ts
│   │   ├── exam.service.ts
│   │   ├── certificate.service.ts
│   │   └── hr.service.ts
│   ├── lib/              # Infrastructure Integrations & Adapters
│   │   ├── payment/      # PaymentGateway interface & Razorpay implementation
│   │   ├── storage/      # StorageService interface & S3/R2 presigned URL generator
│   │   ├── video/        # Bunny.net Stream signed token generator
│   │   └── pdf/          # Certificate & Marksheet PDF generators
│   └── db/               # Prisma client singleton and database extensions
├── lib/                  # Shared Client/Server Utilities
│   ├── env.ts            # Zod-validated environment variables
│   ├── utils.ts          # Tailwind merge (cn), formatting helpers
│   └── constants.ts      # Enums, navigation lists, business constants
└── types/                # Shared TypeScript type definitions and interfaces
```

---

## 3. TypeScript & Coding Standards

### 3.1 Naming Conventions
- **Files & Directories**: `kebab-case` throughout (e.g., `course-card.tsx`, `payment.service.ts`, `use-lead-pipeline.ts`).
- **React Components**: `PascalCase` matching file role (e.g., `export function StudentDashboardHeader()`).
- **Interfaces & Types**: `PascalCase` with descriptive nouns (e.g., `interface CourseWithModules`, `type PaymentGatewayOrder`).
- **Functions & Variables**: `camelCase` with verb prefixes (e.g., `calculatePayableFee`, `isEnrolled`, `hasPermission`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_PAGE_SIZE`, `MAX_COUNSELOR_DISCOUNT_PERCENT`).

### 3.2 Error Handling & Serialization
- Server procedures must throw structured, typed errors using `TRPCError`:
  ```typescript
  // CORRECT
  if (!admission) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'The requested admission record could not be found.',
    });
  }
  ```
- Sensitive internal stack traces or raw database error messages must never be exposed to frontend clients in production.
- All asynchronous operations must be wrapped in `try/catch` blocks or leverage higher-order async boundary handlers.

### 3.3 Database Querying Standards
- Always use `select` or `include` with explicit fields when querying high-frequency or sensitive models:
  ```typescript
  // CORRECT — selects only needed fields, avoids returning passwordHash
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, roleCode: true },
  });
  ```
- Any multi-step mutation altering financial balances, admissions, or enrollment access must use `prisma.$transaction`.

---

## 4. Banned Code Practices

| Prohibited Pattern | Reason | Compliant Alternative |
|---|---|---|
| `any` type | Disables compile-time type safety | Use `unknown` with Zod/type-guards |
| `console.log()` in production | Pollutes logs; can leak PII/credentials | Use structured logger with log levels |
| Client-side discount validation only | Attackers can modify payload via DevTools | Re-calculate and validate caps on server |
| Raw SQL string interpolation | Vulnerable to SQL injection | Use Prisma parameterized queries |
| Storing private assets in public S3 buckets | Intellectual property theft | Use presigned S3/R2 URLs with short TTLs |
| Hardcoding secrets in source files | Security leak risk | Store in `.env` and validate via `env.ts` |
| Bypassing transaction blocks on payments | Ledger corruption on network drop | Wrap order updates & enrollment in `$transaction` |

---

## 5. Git Commit & Branching Protocols

### 5.1 Branching Strategy
- `main`: Production-ready code; protected branch. Deployments are triggered automatically from `main`.
- `develop`: Integration branch for daily staging builds.
- `feat/feature-name`: Feature development branches branched off `develop`.
- `fix/bug-description`: Hotfix and bugfix branches.

### 5.2 Conventional Commits Format
Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <short description in present tense>

[optional detailed body explaining rationale]

[optional issue reference, e.g., Closes #42]
```

**Allowed Types:**
- `feat`: A new user-facing or operational capability.
- `fix`: A bug resolution.
- `refactor`: Code restructuring with zero behavior changes.
- `perf`: A code change that improves compute/database performance.
- `security`: Security patches, rate limiting, or header updates.
- `docs`: Documentation updates.
- `test`: Adding or correcting unit/integration tests.
- `chore`: Tooling, build pipeline, or dependency adjustments.

**Examples:**
- `feat(admissions): add server-side discount cap validation for counselors`
- `fix(payments): prevent duplicate enrollment on repeated razorpay webhooks`
- `security(headers): configure content security policy in next.config.js`
