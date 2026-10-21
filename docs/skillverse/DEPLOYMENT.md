# SLG SKILLVERSE — Subdomain Deployment & DNS Configuration (Live Verified)

## Target Subdomain
`https://skillverse.softlabglobal.com`

## 1. Verified Live DNS & Hosting Configuration
- **DNS Registrar / Nameservers:** GoDaddy (`ns73.domaincontrol.com`, `ns74.domaincontrol.com`).
- **CNAME Record:** `skillverse` -> `cname.vercel-dns.com` (TTL: 3600).
- **Public DNS Propagation:** Verified on local resolver, Google DNS (`8.8.8.8`), and Cloudflare DNS (`1.1.1.1`).
- **Hosting Provider:** Vercel (Edge Network).
- **HTTPS & SSL/TLS:** Automatically provisioned by Vercel with HTTP/1.1 and HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).

## 2. Live Tested Public Endpoints
All endpoints tested live over HTTPS with HTTP 200 OK:
- **Homepage:** `https://skillverse.softlabglobal.com/` (`X-Matched-Path: /skillverse`, `Server: Vercel`, `HTTP 200 OK`)
- **Health & Readiness:** `https://skillverse.softlabglobal.com/api/skillverse/health` (`"status":"HEALTHY"`, `"databaseConnected":true`, `latencyMs: ~184ms`, `HTTP 200 OK`)
- **Course Catalogue:** `https://skillverse.softlabglobal.com/courses` and `https://skillverse.softlabglobal.com/skillverse/courses` (`HTTP 200 OK`)
- **Admissions Pipeline:** `https://skillverse.softlabglobal.com/admissions` (`HTTP 200 OK`)
- **Student LMS Login:** `https://skillverse.softlabglobal.com/student-login` (`HTTP 200 OK`)
- **Parent Portal Login:** `https://skillverse.softlabglobal.com/parent-login` (`HTTP 200 OK`)
- **Staff / Admin Login:** `https://skillverse.softlabglobal.com/staff-login` (`HTTP 200 OK`)

## 3. Coexistence & Multi-Tenant Boundaries
- **Main Website (`https://www.softlabglobal.com/`):** Continues serving the SoftLab Global flagship website (`HTTP 200 OK`, `X-Matched-Path: /`).
- **LMS Portal (`https://lms.softlabglobal.com/`):** Continues serving the IT LMS (`HTTP 307` redirect to `/login`).
- **Skillverse Subdomain (`https://skillverse.softlabglobal.com/`):** Completely isolated via `src/middleware.ts` host rewrite to `(skillverse)` route group.
