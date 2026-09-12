# SOFTLAB GLOBAL — Production Operational Runbook

> **Version:** 1.0.0 (Production Release)  
> **Target Audience:** DevOps Engineers, Site Reliability Engineers, System Administrators  
> **Platform:** Next.js 14 + PostgreSQL 16 + Node.js 20+

---

## 1. System Architecture & Component Map

The SOFTLAB GLOBAL enterprise platform runs as an integrated full-stack application:
- **Application Runtime**: Next.js App Router (Node.js 20 LTS runtime).
- **Relational Storage**: PostgreSQL 16 with Prisma ORM 5.x.
- **Monetary Unit**: Integer Paise ($\text{100 Paise} = \text{₹1.00}$) across all fees, orders, transactions, and payroll records.
- **Security Boundary**: Zero-trust server-side tRPC RBAC guards, encrypted JWT sessions (8h TTL), and hardened HTTP security headers.

---

## 2. Environment Configuration & Secret Management

All production environment secrets must be stored in protected secret stores (e.g., AWS Secrets Manager, Infisical, or Vault) and never committed to version control:

| Key | Purpose | Required Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled PostgreSQL connection string | `postgresql://user:pass@host:5432/db?pgbouncer=true` |
| `DIRECT_URL` | Direct connection string for Prisma migrations | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | 32+ byte cryptographic random hex string | `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Canonical public HTTPS base URL | `https://softlabglobal.com` |
| `RAZORPAY_KEY_ID` | Production Merchant Key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Production Merchant Secret | High-entropy alphanumeric string |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification signing secret | High-entropy alphanumeric string |

---

## 3. Database Operations & Backup Strategy

### 3.1 Automated Nightly Backup
```bash
# Snapshot entire PostgreSQL database with custom compressed format
pg_dump -h localhost -U postgres -d softlab_global -F c -b -v -f /backups/softlab_global_$(date +%Y%m%d_%H%M%S).dump
```

### 3.2 Point-in-Time Restore
```bash
# Restore specific snapshot to fresh database instance
pg_restore -h localhost -U postgres -d softlab_global_recovery -v /backups/softlab_global_20260912_000000.dump
```

### 3.3 Zero-Downtime Migration Deployment
Never use `prisma db push` in production. Always deploy verified migration scripts:
```bash
npx prisma migrate deploy
npx prisma migrate status
```

---

## 4. HTTP Security Headers & Zero-Leak Audit

Next.js `next.config.js` injects the following security headers on all routes:
- `X-Frame-Options: DENY` (Clickjacking prevention).
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- `X-XSS-Protection: 1; mode=block`.

---

## 5. System Health Diagnostics & Monitoring

- **In-App Health Endpoint**: `/admin/system`
- **Internal RPC Ping**: `system.getHealthCheck`
- **Health Indicators**:
  - PostgreSQL latency: Normal `< 50ms`. Alert if `> 200ms`.
  - V8 Heap memory: Normal `< 500MB`. Alert if `> 1.2GB`.
  - Unhandled promise rejection: Trigger automated alert to SRE team.

---

## 6. Disaster Recovery & Emergency Failover

1. **Database Unavailability**:
   - Check PostgreSQL daemon: `Get-Process postgres` or `systemctl status postgresql`.
   - Inspect PostgreSQL error log in `/data/pg_log/`.
   - If storage corruption occurs, initiate restore from latest nightly `.dump`.
2. **Payment Gateway Disruption**:
   - Webhook retries are idempotent and handled by `PaymentService.handleRazorpayWebhook`. Duplicate webhook triggers will not generate duplicate student enrollments.
   - Offline payment recording (`payments:record_offline`) remains operational for manual cash/NEFT clearance.
3. **Session Compromise or Rogue Credential**:
   - Rotate `NEXTAUTH_SECRET` immediately in production environment settings.
   - Restart Next.js cluster. All existing JWT sessions will be invalidated immediately.
