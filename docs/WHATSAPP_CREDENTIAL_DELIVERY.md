# WhatsApp Credential & Admission Delivery Report

**Files:** `src/server/services/whatsapp-business-config.service.ts`, `src/app/api/webhooks/whatsapp/route.ts`, `src/components/admin/communications/whatsapp-provider-modal.tsx`

## Current Production Status — `BLOCKED` (Code `PASS`)
- Official Cloud API verification, automatic numeric Phone Number ID discovery from `/{WABA_ID}/phone_numbers`, HMAC-SHA256 webhook signature enforcement, and `NotificationDeliveryLog` status sync are deployed and verified.
- Live WhatsApp Cloud API delivery remains **BLOCKED** until the administrator supplies:
  1. Non-expired Meta `Conversions API System User` (`61595490181018`) permanent access token (currently stored DB token expired `15-Nov-26 01:00:00 PST`).
  2. Numeric Meta `Phone Number ID` (auto-discovered on `Test Live Connection`).
  3. `WHATSAPP_APP_SECRET` in `/var/www/softlab-global/.env`.
