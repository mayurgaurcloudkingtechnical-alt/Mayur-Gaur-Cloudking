# RBAC & Distribution Audit

## 1. Communication Hub RBAC (`src/server/trpc/routers/notification.ts`)
- **Before:** `ensureAuthorized()` restricted all endpoints to `[SUPER_ADMIN, DIRECTOR, ADMIN, HR]`, causing `FORBIDDEN` errors for `MANAGER`, `COUNSELOR`, `TELECALLER`, and `PLACEMENT_OFFICER` even though `/admin/communications` page allowed them.
- **After:** Split into:
  - `ensureReadAuthorized(user)`: `[SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER, HR, COUNSELOR, TELECALLER, PLACEMENT_OFFICER]` for `getDeliveryStats`, `listDeliveryLogs`, `listHigherAuthorities`.
  - `ensureAuthorized(user)`: `[SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER, HR]` for `retryNotification`, `createHigherAuthority`, `updateHigherAuthority`, `toggleHigherAuthorityStatus`, `sendTestNotification`.
- **Live Verification:** `COUNSELOR` session received `HTTP 200` on `/admin/communications` and `trpc.notifications.getDeliveryStats`.

## 2. WhatsApp Provider Credentials RBAC (`src/server/trpc/routers/omnichannel.ts`)
- `saveWhatsAppCredentials` and `saveSalesGroupConfig` now enforce `["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"]` and strip `accessToken` from responses.

## 3. Enterprise Data Hub RBAC (`src/app/api/enterprise-data/route.ts` & `/admin/data-hub`)
- Restricted strictly to `["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"]`.
- **Live Verification:**
  - Unauthenticated `/api/enterprise-data`: `HTTP 401`
  - Unauthenticated `/api/communications/export`: `HTTP 401`
  - Authenticated `COUNSELOR` on `/api/enterprise-data`: `HTTP 403 Forbidden`
