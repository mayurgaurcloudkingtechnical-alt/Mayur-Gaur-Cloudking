# Delivery Analytics Verification Report

**Target:** `/admin/communications` & `GET /api/communications/export`

## Verification Results
1. **12 Recipient-Wise KPIs (`trpc.notifications.getDeliveryStats`) — `PASS`**
   - **Database:** `NotificationDeliveryLog`
   - **Observed Breakdown:** `total = 20`, `totalRecipients = 13`, `SENT = 15` (Mailcow SMTP), `SIMULATED = 3` (legacy staged), `FAILED = 2`.
   - **Separation Check:** Simulated records are tracked in their own counter (`simulated`) and never counted as `SENT` or `DELIVERED`.
2. **CSV Export (`GET /api/communications/export?format=csv`) — `PASS`**
   - **Observed Output:** `HTTP 200`, `4,929` bytes.
3. **Excel Export (`GET /api/communications/export?format=xlsx`) — `PASS`**
   - **Observed Output:** `HTTP 200`, `8,107` bytes valid `.xlsx` (`exceljs`).
4. **RBAC Access — `PASS`**
   - Unauthenticated: `HTTP 401`.
   - `COUNSELOR`: `HTTP 200` on `/admin/communications` and `trpc.notifications.getDeliveryStats`.
