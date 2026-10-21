# SLG SKILLVERSE — Architecture & Venture Boundaries

## 1. Repository & Monorepo Context
The SoftLab Global repository is a Next.js 14.2.15 + Prisma 5.20.0 + PostgreSQL 16 + tRPC v11 + NextAuth v5 application deployed via `railway.json` and fronted by `nginx.conf`.
Other isolated ventures in this repository (such as **SIA**) use a two-tier structure:
1. **`apps/<venture>/`** (e.g., `apps/sia-web/`, `apps/skillverse/`) — Venture workspace manifest, isolated test suite (`apps/skillverse/tests/`), venture-specific static assets (`apps/skillverse/public/`), and modular exports (`apps/skillverse/src/`).
2. **Next.js App Router Route Group (`src/app/(skillverse)/skillverse/*`)** — Served directly by the unified Next.js server and mapped to `https://skillverse.softlabglobal.com` via `src/middleware.ts` and `nginx.conf`.

## 2. Subdomain & Routing Isolation
- **Target Hostname:** `https://skillverse.softlabglobal.com`
- **Middleware (`src/middleware.ts`)**:
  - Inspects `req.headers.get("host")` (or `?portal=skillverse`).
  - When `host.startsWith("skillverse.")`, rewrites incoming paths (`/`, `/courses`, `/packages-and-fees`, `/admissions`, `/student-login`, `/parent-login`, `/staff-login`, etc.) to `/skillverse/*`.
  - Requests to `www.softlabglobal.com`, `lms.softlabglobal.com`, and `api.softlabglobal.com` bypass Skillverse rewriting completely.

## 3. Backend, API & Database Isolation
- **tRPC Router:** `src/server/trpc/routers/skillverse.ts` (`trpc.skillverse.*`).
- **Service Layer:** `src/server/services/skillverse.service.ts`.
- **REST Endpoints:**
  - `/api/skillverse/health` (Readiness & provider status)
  - `/api/skillverse/payment/create-order` (Server-created Razorpay/Sandbox orders)
  - `/api/skillverse/payment/verify` (HMAC-SHA256 payment verification)
- **PostgreSQL Namespace (`system_settings`)**:
  - Uses dedicated `category` values prefixed with `SKILLVERSE_` (`SKILLVERSE_CONFIG`, `SKILLVERSE_ENQUIRY`, `SKILLVERSE_STUDENT`, `SKILLVERSE_INVOICE`, `SKILLVERSE_CERTIFICATE`, `SKILLVERSE_ASSESSMENT`, `SKILLVERSE_NOTIFICATION`, `SKILLVERSE_ANALYTICS`, `SKILLVERSE_AUDIT`).
  - Zero destructive schema migrations; zero pollution of existing `Lead`, `Course`, `Enrollment`, or `StudentProfile` tables.
