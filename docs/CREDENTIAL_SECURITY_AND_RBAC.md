# Credential Security & Hierarchical RBAC Report

**Files:** `src/server/services/credential-security.service.ts`, `src/app/api/admin/credentials/route.ts`, `src/components/admin/users/credential-management-panel.tsx`  
**Commit:** `435a36f`

## Authority Hierarchy & Encryption
- `AUTHORITY_RANK`: `SUPER_ADMIN (100)` > `DIRECTOR (80)` > `ADMIN (70)` > `MANAGER (60)` > `HR (55)` > `ACCOUNTANT/PLACEMENT_OFFICER (35)` > `COUNSELOR/TRAINER (30)` > `TELECALLER (20)` > `STUDENT (10)`.
- Strictly enforces `actorRank > targetRank`, department/reporting scope for `MANAGER`, non-student scope for `HR`, and zero self-reveal.
- Permanent passwords use `bcrypt` hashes and are never retrievable; temporary credentials use `AES-256-GCM` (`EncryptedTemporaryCredential`, 72h TTL) with `AuditLog` tracking.

## Live Verification (`PASS`)
- `COUNSELOR` `/api/admin/credentials` → `HTTP 403`
- `HR` resetting `SUPER_ADMIN` → `HTTP 403`
- `SUPER_ADMIN` audited temp reveal (`SLG-EMP-2026-0015`) → `HTTP 200`, `matchesIssuedTempPassword=true`
