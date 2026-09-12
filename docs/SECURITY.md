# SOFTLAB GLOBAL — Comprehensive Security Architecture & Threat Model

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Philosophy:** Zero-Trust Defense in Depth (No fake security, strict server-side validation)

---

## 1. Security Architecture Summary

SOFTLAB GLOBAL protects sensitive institutional records (student PII, marks, payment logs, payroll) through multi-layered defense controls:

| Security Vector | Defense Control | Technical Mechanism |
|---|---|---|
| **Identity Theft & Session Hijacking** | Encrypted JWT Session Cookies | NextAuth.js v5, HttpOnly, Secure, SameSite=Strict cookies |
| **Credential Attacks** | Adaptive Hashing & Lockout | `bcryptjs` with cost 12, Redis-backed brute-force rate limiter |
| **Broken Access Control (OWASP #1)** | Server-Enforced RBAC | Procedure-level tRPC middleware checking DB permission array |
| **Payment Tampering / Fraud** | Webhook HMAC Verification | Timing-safe HMAC-SHA256 signature verification + DB price lookup |
| **SQL Injection (OWASP #3)** | Parameterized ORM Queries | Prisma query engine parameterized statements; zero raw string queries |
| **Cross-Site Scripting (XSS)** | Auto-Escaping + DOMPurify | React JSX escaping + DOMPurify sanitization on rich-text lesson bodies |
| **Cross-Site Request Forgery (CSRF)**| SameSite Cookies + Origin Check| SameSite=Strict cookie policy + NextAuth CSRF protection |
| **Asset & Video Piracy** | Ephemeral Signed Tokens | Bunny.net token auth with SHA-256 HMAC & client IP pinning |
| **Denial of Service (DoS)** | Multi-Tier Rate Limiting | `@upstash/ratelimit` with Redis backend across public endpoints |
| **Data Breach via Log Leakage** | Sanitized Structured Logging | Winston/Pino logger scrubbing passwords, tokens, and bank details |

---

## 2. Authentication & Session Security

### 2.1 Password Security Standards
- Passwords must be a minimum of 8 characters, containing at least one uppercase letter, one lowercase letter, one number, and one special character (enforced via Zod schema).
- Hashing is performed using `bcryptjs` with a work factor of **12 rounds**, offering strong protection against offline GPU cracking dictionaries.
- Passwords are never returned in database selects or serialized in API responses (`select: { passwordHash: false }`).

### 2.2 Session Management
- Sessions use JSON Web Tokens (JWT) signed with `NEXTAUTH_SECRET` (minimum 32-byte cryptographic entropy).
- Tokens are stored exclusively in **HttpOnly, Secure, SameSite=Strict** cookies. JavaScript running in the browser cannot read or exfiltrate session tokens.
- Max session lifetime is capped at **8 hours** (28,800 seconds). Users must re-authenticate thereafter.

### 2.3 Brute-Force & Credential Stuffing Prevention
Login attempts against `/api/auth/callback/credentials` are rate-limited per IP and target email:
- Maximum 5 failed attempts per 15-minute sliding window.
- Subsequent attempts are rejected with `HTTP 429 Too Many Requests`.

---

## 3. Server-Side RBAC Enforcement Pipeline

Every tRPC query or mutation executing business logic passes through an authorization middleware pipeline:

```
[ Incoming Request: e.g. `trpc.courses.publish({ id: "course_123" })` ]
                                │
                                ▼
               ┌─────────────────────────────────┐
               │ 1. Session Authentication Check │
               └────────────────┬────────────────┘
                                │ Valid?
                                ├── NO  ──► Throw TRPCError({ code: "UNAUTHORIZED" })
                                └── YES
                                     │
                                     ▼
               ┌─────────────────────────────────┐
               │ 2. Context Extraction           │
               │    ctx.user: { id, roleCode }   │
               └────────────────┬────────────────┘
                                     │
                                     ▼
               ┌─────────────────────────────────┐
               │ 3. Permission Claim Lookup      │
               │    (Cached in Redis for 5 mins) │
               └────────────────┬────────────────┘
                                     │
                                     ▼
               ┌─────────────────────────────────┐
               │ 4. Evaluate Procedure Guard     │
               │    `requirePermission('courses:publish')`
               └────────────────┬────────────────┘
                                │ Has Permission?
                                ├── NO  ──► Log Security Event to AuditLog
                                │           Throw TRPCError({ code: "FORBIDDEN" })
                                └── YES
                                     │
                                     ▼
               ┌─────────────────────────────────┐
               │ 5. Domain Scoping Inspection    │
               │    e.g. Is Trainer assigned to  │
               │    this specific course?        │
               └────────────────┬────────────────┘
                                │ Authorized?
                                ├── NO  ──► Throw TRPCError({ code: "FORBIDDEN" })
                                └── YES
                                     │
                                     ▼
               ┌─────────────────────────────────┐
               │ 6. Execute Service Logic        │
               └─────────────────────────────────┘
```

---

## 4. Payment Security & Fraud Mitigation

1. **Client Price Manipulation**: The client never submits an `amount` parameter when initiating an order. The server queries the `Admission` record and passes `Admission.finalPayableFee` directly to Razorpay.
2. **Timing-Safe HMAC Verification**: Webhook payloads are hashed using the shared secret and compared using Node's `crypto.timingSafeEqual`:
   ```typescript
   crypto.timingSafeEqual(
     Buffer.from(signature, 'utf8'),
     Buffer.from(expectedSignature, 'utf8')
   );
   ```
   This prevents timing-attack side-channel vulnerabilities.
3. **Idempotent Webhook Processing**: Webhooks track the `gatewayOrderId` in PostgreSQL. If the payment record is already in `SUCCESS` status, the webhook responds with `200 OK` immediately, preventing duplicate credit or double enrollment.
4. **Discrepancy Circuit Breaker**: If Razorpay's API reports an amount different from the database's expected fee, the payment is moved to `FAILED`, flagged as potential fraud, and an alert is dispatched to `SUPER_ADMIN`.

---

## 5. Secure HTTP Headers Configuration

The production Next.js instance enforces strict security response headers in `next.config.js`:

```javascript
// next.config.js security headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY', // Prevents Clickjacking attacks
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff', // Prevents MIME-type sniffing
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://images.unsplash.com;
      font-src 'self' data:;
      frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://iframe.videodelivery.net;
      connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com;
    `.replace(/\s{2,}/g, ' ').trim(),
  },
];
```

---

## 6. Audit Logging & Non-Repudiation

An immutable, append-only `AuditLog` table stores records of sensitive administrative actions:

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  actorId      String?
  action       String   // e.g. "OVERRIDE_FEE_DISCOUNT", "REVOKE_CERTIFICATE", "CHANGE_USER_ROLE"
  resourceType String   // e.g. "Admission", "Certificate", "User"
  resourceId   String
  previousData Json?    // Snapshot of previous database record
  newData      Json?    // Snapshot of updated database record
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())
}
```

No user, including `SUPER_ADMIN`, can modify or delete entries in the `AuditLog` table through application interfaces.

---

## 7. Secrets Management & Environment Hygiene

1. `.env` and `.env.local` are strictly ignored by `.gitignore`.
2. Any configuration prefixed with `NEXT_PUBLIC_` is assumed public. Secrets (e.g. `RAZORPAY_KEY_SECRET`, `NEXTAUTH_SECRET`, `STORAGE_SECRET_KEY`, `DATABASE_URL`) are strictly restricted to Node.js server runtimes.
3. Server environment variables are validated at build/boot time using Zod. The server process immediately aborts if any critical secret is missing.

---

## 8. Examination & Certificate Security Controls (Day 10 Standards)

### 8.1 Zero-Trust Question Delivery
- When a student requests an exam via `api.exam.getStudentExam`:
  1. The server verifies active enrollment in the parent course.
  2. The database query strictly omits `correctAnswer` and `explanation` from the payload (`select: { id, questionText, type, options, marks }`).
  3. Correct answer keys are only evaluated server-side upon submission.

### 8.2 Attempt Lifecycle & Timer Tamper-Resistance
- Exam attempt start timestamps are pinned on the database server (`startedAt: new Date()`).
- In `saveAnswer` and `submitAttempt`, elapsed duration is computed server-side from `attempt.startedAt`.
- Client-side timers serve purely as UI conveniences. If the duration exceeds allowed minutes (+ 60-second grace period for latency), new answers are rejected and the attempt is auto-submitted.
- Submissions are idempotent: duplicate calls to `submitAttempt` return the evaluated score without recalculation or state corruption.

### 8.3 Collision-Free Certificate Generation & Privacy
- Certificate number format: `SLG-CERT-YYYY-XXXXX`.
- Generated using an atomic sequence reservation counter with fallback entropy suffixing (`crypto.randomBytes(3).toString("hex").toUpperCase()`) to eliminate collisions under high concurrent loads.
- Public verification at `/verify/certificate/[certificateNumber]` exposes only academic credentials (student name, course title, completion date, verification token, QR code). Private student email, phone, and fee details are never exposed.
