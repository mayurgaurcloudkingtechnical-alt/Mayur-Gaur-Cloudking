# Meta WhatsApp Configuration Audit — SoftLab Global

**Audit Date:** `2026-11-15`  
**Production URL:** `https://lms.softlabglobal.com`  
**Meta Business Portfolio:** `SOFTLAB GLOBAL` (`2161320211099371`)  
**Meta App:** `SoftLab Global Omnichannel` (`1572356260711362`)  
**System User:** `Conversions API System User` (`61595490181018`)  

## 1. Environment & Database Configuration Snapshot (Secrets Redacted)
- **VPS `.env`:**
  - `WHATSAPP_APP_ID`: `1572356260711362` (SET)
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`: `1071124442294607` (SET)
  - `WHATSAPP_VERIFY_TOKEN`: `softlab_whatsapp_2026` (SET)
  - `WHATSAPP_PHONE_NUMBER_ID`: `MISSING / empty`
  - `WHATSAPP_ACCESS_TOKEN`: `MISSING / empty`
  - `WHATSAPP_APP_SECRET`: `MISSING / empty`
- **PostgreSQL `SystemSetting` (`whatsapp_business_config`):**
  - `appId`: `1572356260711362`
  - `wabaId`: `1071124442294607`
  - `phoneNumberId`: `9196596975` *(Defect identified: display phone number stored instead of Meta numeric Phone Number ID)*
  - `displayPhoneNumber`: `+919196596975`
  - `connectionStatus`: `ERROR`
  - `accessToken`: `SET (306 chars, redacted)` — **Expired**

## 2. Official Meta Graph API v20.0 Validation Output
Tested against `/me`, `/me/permissions`, `/2161320211099371/owned_whatsapp_business_accounts`, and `/1071124442294607/phone_numbers`:
- **HTTP Status:** `401`
- **Error:** `{"error":{"message":"Error validating access token: Session has expired on Sunday, 15-Nov-26 01:00:00 PST. The current time is Sunday, 15-Nov-26 05:21:55 PST.","type":"OAuthException","code":190,"error_subcode":463}}`

## 3. Code Repairs Implemented
- **`src/server/services/whatsapp-business-config.service.ts`:**
  - Removed auto-`CONNECTED` override on `saveConfig()`.
  - Added automatic numeric `Phone Number ID` discovery from `/{WABA_ID}/phone_numbers` and `/{WABA_ID}/subscribed_apps` webhook subscription verification inside `verifyMetaConnection()`.
  - Added `disconnect()` and `subscribeWebhook()`.
- **`src/app/api/webhooks/whatsapp/route.ts`:**
  - Enforced `crypto.timingSafeEqual` HMAC-SHA256 verification when `WHATSAPP_APP_SECRET` is configured.
  - Added `NotificationDeliveryLog` status sync (`SENT`, `DELIVERED`, `READ`, `FAILED`) and inbound media handling (`image`, `document`, `video`, `audio`, `voice`).
